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
	//Quaternion,
	//TextAnchorLocation,
	User,
	Vector3,
	Sound
} from '@microsoft/mixed-reality-extension-sdk';
//import { userInfo } from 'os';

//import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';
//import { appendFile } from 'fs';

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private assets: AssetContainer;
	private allLeftHands = new Map();
	private allRightHands = new Map();

	private ourRightHand: Actor = null;
	private ourLeftHand: Actor = null;
	private ourRightSound: Actor = null;
	private ourLeftSound: Actor = null;

	private ourSounds: Sound[]= [];
	
	private currentRightPitch = 0.0;
	private currentLeftPitch = 0.0;

	private userID: string;
	private counter = 0;

	constructor(private context: Context, private baseUrl: string) {
		log.info("app","our constructor started");
		this.assets = new AssetContainer(context);

		this.context.onStarted(() => this.started());
		this.context.onUserLeft(user => this.userLeft(user));
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private computeFlatDistance(ourVec: Vector3) {
		const tempPos = ourVec.clone();
		tempPos.y = 0; //ignore height off the ground
		return tempPos.length();
	}


	private playSound(label: string, handPos: Vector3, soundActor: Actor) {
		const ourDist = this.computeFlatDistance(handPos);
		const height=handPos.y;

		log.info("app", label + " dist: " + ourDist);
		log.info("app", "     height: " + height);
		const ourPitch = ourDist * -30.0;
		log.info("app", "     pitch: " + ourPitch);

		let indexID = 0;

		if (height > 1.0 && height < 2.0) {
			indexID = Math.trunc((height - 1.0) * 20.0);
		}
		if (height >= 2.0){
			indexID = 20;
		}

		if (ourDist < 1.0) {
			soundActor.startSound(this.ourSounds[indexID].id, {
				doppler: 0,
				pitch: ourPitch
			});
		}
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
			const hDist = this.computeFlatDistance(hand.transform.app.position);
			if (hDist < closestDist) {
				closestDist = hDist;
				closestActor = hand;
			}
		}
		return closestActor;
	}

	private started() {
		log.info("app","our started callback has begun");
		
		for (let i=1; i < 51; i++) {
			const filename = `${this.baseUrl}/saw_` + i.toString() + ".wav";
			log.info("app", "trying to load filename: " + filename);


			const newSound = this.assets.createSound("dave sound" + i.toString(), {
				uri: filename
			});

			this.ourSounds.push(newSound);
			log.info("app", "   done!");
		}

		this.ourRightSound = Actor.Create(this.context);
		this.ourLeftSound = Actor.Create(this.context);

		const circle = this.assets.createCylinderMesh('circle', 6.0, 0.1, 'y', 16);
		const ourPole = Actor.Create(this.context, {
			actor: {
				name: 'the pole',
				appearance: { meshId: circle.id }
			}
		});

		//generate new audio. activate small snippets. kind of a granular synthesis. 
		setInterval(() => {
			if (this.ourRightHand) {
				this.playSound("right", this.ourRightHand.transform.app.position, this.ourRightSound);
			}
			if (this.ourLeftHand) {
				this.playSound("left ", this.ourLeftHand.transform.app.position, this.ourLeftSound);
			}
		}, 50); //fire every 50ms

		//keep checking who has the closest hand to theremin. put that hand in charge
		setInterval(() => {			
			this.ourLeftHand=this.findClosestHand(this.allLeftHands);
			this.ourRightHand=this.findClosestHand(this.allRightHands);
		}, 1000); //fire every 1 sec
	}
}
