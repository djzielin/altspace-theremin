/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	//AnimationEaseCurves,
	//AnimationKeyframe,
	//AnimationWrapMode,
	AssetContainer,
	//ButtonBehavior,
	Context,
	MediaInstance,
	//Quaternion,
	//TextAnchorLocation,
	User,
	Vector3,
	Sound
} from '@microsoft/mixed-reality-extension-sdk';

import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';

class SoundHand {
	private soundActor: Actor;
	private handName: string;
	private playingSounds: MediaInstance[] = [];

	constructor(name: string, private context: Context) {
		this.soundActor = Actor.Create(context);
		this.handName=name;
	}

	public computeFlatDistance(ourVec: Vector3) {
		const tempPos = ourVec.clone();
		tempPos.y = 0; //ignore height off the ground
		return tempPos.length();
	}

	public playSound(theSound: Sound) {
		const soundInstance: MediaInstance = this.soundActor.startSound(theSound.id, {
			doppler: 0,
			pitch: 0.0,
			looping: true,
			volume: 0.0
		});

		this.playingSounds.push(soundInstance); //store for potential later use
	}

	private clampVal(incoming: number): number {
		if (incoming < 0.0) {
			return 0.0;
		}
		if (incoming > 1.0) {
			return 1.0;
		}
		return incoming;
	}

	public updateSound(handPos: Vector3) {
		const ourDist = this.clampVal(this.computeFlatDistance(handPos));

		//if theremin is 1m tall, it ranges from -0.5 to 0.5. raise to range 0 to 1
		const ourHeight = this.clampVal(handPos.y + 0.5); 

		const ourPitch = (ourDist) * -30.0;
		const ourVol = ourHeight;

		/*log.info("app", this.handName);
		log.info("app", "     dist: " + ourDist);
		log.info("app", "     height: " + ourHeight);
		log.info("app", "     pitch: " + ourPitch);
		log.info("app", "     vol: " + ourVol);*/

		this.playingSounds[1].setState(
			{
				pitch: ourPitch,
				volume: ourVol
			});
	}
}
/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private assets: AssetContainer;

	private rightSoundHand: SoundHand = null;
	private leftSoundHand: SoundHand = null;

	private allLeftHands = new Map();
	private ourLeftHand: Actor = null;

	private allRightHands = new Map();
	private ourRightHand: Actor = null;

	private ourSounds: Sound[] = [];

	private userID: string;
	private counter = 0;

	constructor(private context: Context, private baseUrl: string) {
		log.info("app", "our constructor started");
		this.assets = new AssetContainer(context);

		this.context.onStarted(() => this.started());
		this.context.onUserLeft(user => this.userLeft(user));
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private userJoined(user: User) {
		log.info("app", "user joined. id: " + user.id);

		const rHand = Actor.Create(this.context, {
			actor: {
				attachment: {
					attachPoint: 'right-hand',
					userId: user.id
				}
			}
		});
		rHand.subscribe('transform');
		this.allRightHands.set(user.id, rHand);
		log.info("app", "   added their right hand");

		const lHand = Actor.Create(this.context, {
			actor: {
				attachment: {
					attachPoint: 'left-hand',
					userId: user.id
				}
			}
		});
		lHand.subscribe('transform');
		this.allLeftHands.set(user.id, lHand);
		log.info("app", "   added their left hand");
	}

	private userLeft(user: User) {
		log.info("app", "user left: " + user.name);

		let lHand: Actor = this.allLeftHands.get(user);

		if (lHand !== undefined) {
			this.allLeftHands.delete(lHand);
			lHand.destroy();
			lHand = null;
			log.info("app", "  succesfully remove left hand");
		}


		let rHand: Actor = this.allLeftHands.get(user);

		if (rHand !== undefined) {
			this.allRightHands.delete(rHand);
			rHand.destroy();
			rHand = null;
			log.info("app", "  succesfully remove right hand");
		}
	}

	private findClosestHand(handMap: Map<string, Actor>) {
		let closestDist = Infinity;
		let closestActor: Actor = null;

		for (let hand of handMap.values()) {
			const hDist = this.rightSoundHand.computeFlatDistance(hand.transform.app.position);
			if (hDist < closestDist) {
				closestDist = hDist;
				closestActor = hand;
			}
		}
		return closestActor;
	}

	private loadSound(filename: string) {
		log.info("app", "trying to load filename: " + filename);
		const newSound = this.assets.createSound("dave long sound", {
			uri: filename
		});
		if (newSound) {
			log.info("app", "   succesfully loaded sound!");
		}
		this.ourSounds.push(newSound);
	}

	private started() {
		log.info("app", "our started callback has begun");

		this.loadSound(`${this.baseUrl}/long_sine.mp3`);
		this.loadSound(`${this.baseUrl}/long_saw.mp3`);

		this.rightSoundHand = new SoundHand("right", this.context);
		this.rightSoundHand.playSound(this.ourSounds[0]);
		this.rightSoundHand.playSound(this.ourSounds[1]);

		this.leftSoundHand = new SoundHand("left", this.context);
		this.leftSoundHand.playSound(this.ourSounds[0]);
		this.leftSoundHand.playSound(this.ourSounds[1]);

		const circle = this.assets.createCylinderMesh('circle', 1.0, 0.01, 'y', 16);
		const ourPole = Actor.Create(this.context, {
			actor: {
				name: 'the pole',
				appearance: { meshId: circle.id }
			}
		});

		setInterval(() => {
			if (this.ourRightHand) {
				this.rightSoundHand.updateSound(this.ourRightHand.transform.app.position);
			}
			if (this.ourLeftHand) {
				this.leftSoundHand.updateSound(this.ourLeftHand.transform.app.position);
			}
		}, 30); //fire every 50ms

		//keep checking who has the closest hand to theremin. put that hand in charge
		setInterval(() => {
			this.ourLeftHand = this.findClosestHand(this.allLeftHands);
			this.ourRightHand = this.findClosestHand(this.allRightHands);
		}, 1000); //fire every 1 sec
	}
}
