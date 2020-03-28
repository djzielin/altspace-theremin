/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	AnimationEaseCurves,
	AnimationKeyframe,
	AnimationWrapMode,
	AssetContainer,
	//ButtonBehavior,
	Context,
	MediaInstance,
	Mesh,
	Material,
	//Quaternion,
	//TextAnchorLocation,
	User,
	Vector3,
	Sound,
	Color4
} from '@microsoft/mixed-reality-extension-sdk';

import colorsys from 'colorsys';

import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';

class SoundHand {
	private soundActor: Actor;
	private playingSounds: MediaInstance[] = [];
	private boxMesh: Mesh;
	private visCubes: Actor[] = [];
	private frameCounter=0;
	private currentCube: Actor=null;
	private cubeTarget: Vector3;


	constructor(private handName: string, private context: Context, private assets: AssetContainer) {
		this.soundActor = Actor.Create(context);
		this.boxMesh = this.assets.createBoxMesh('box', .02, 0.02, 0.02);

		for(let i=0;i<30;i++)
		{
			const ourMat: Material = this.assets.createMaterial('cube mat',{
				color: new Color4(1.0,1.0,1.0,1.0)
			});

			const ourBox = Actor.Create(this.context, {
				actor: {
					name: 'the box',
					appearance: 
					{ 
						meshId: this.boxMesh.id,
						materialId: ourMat.id
					},
				}
			});

			this.visCubes.push(ourBox);
		}
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

	private clampVal(incoming: number, min: number, max: number): number {
		if (incoming < min) {
			return min;
		}
		if (incoming > max) {
			return max;
		}
		return incoming;
	}

	private generateKeyframes(duration: number, endPos: Vector3): AnimationKeyframe[] {
		return [{
			time: 0 * duration,
			value: { transform: { local: { position: new Vector3(0, 0, 0) } } }
		}, {
			time: 0.25 * duration,
			value: { transform: { local: { position: endPos.multiplyByFloats(0.25, 0.25, 0.25) } } }
		}, {
			time: 0.5 * duration,
			value: { transform: { local: { position: endPos.multiplyByFloats(0.5, 0.5, 0.5) } } }
		}, {
			time: 0.75 * duration,
			value: { transform: { local: { position: endPos.multiplyByFloats(0.75, 0.75, 0.75) } } }
		}];
	}
	public updateSound(handPos: Vector3) {
		const flatDist: number = this.computeFlatDistance(handPos);
		const ourDist: number = this.clampVal(flatDist,0.0,1.0);

		//if theremin is 1m tall, it ranges from -0.5 to 0.5. raise to range 0 to 1
		const ourHeight = this.clampVal(handPos.y + 0.5,0.0,1.0);

		const ourPitch = (1.0 - ourHeight) * -30.0;
		let ourVol = (1.0 - ourDist);

		//log.info("app", this.handName);
		//log.info("app", "     dist: " + ourDist);
		//log.info("app", "     height: " + ourHeight);
		//log.info("app", "     pitch: " + ourPitch);
		//log.info("app", "     vol: " + ourVol);

		if (flatDist > 1.0) {
			ourVol = 0.0;
		}

		this.playingSounds[1].setState(
			{
				pitch: ourPitch,
				volume: ourVol
			});

		if (this.frameCounter % 3 === 0) {
			if (flatDist < 1.0) {

				this.cubeTarget = new Vector3(0, this.clampVal(handPos.y,-0.5,0.5), 0);

				this.currentCube= this.visCubes.shift();
				//for(const s in currentCube.animationsByName.keys())
				//	log.info("app","animations: " + s);

				this.currentCube.transform.local.position=handPos;
				
				//const values=colorsys.hsvToRgb(ourHeight,1.0,1.0); //TODO figure out HSV to RGB
				this.currentCube.appearance.material.color=new Color4(ourHeight, 1.0-ourHeight, 0.0, 1.0);

			
				this.visCubes.push(this.currentCube); //add back to the end of the queue
			}
		}
		if ((this.frameCounter - 1) % 3 === 0) {
			if (this.currentCube) {
				this.currentCube.animateTo({
					transform: {
						local: { position: this.cubeTarget }
					}
				}, 1.0 * flatDist, AnimationEaseCurves.Linear);
			}
		}
		this.frameCounter++;
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
				transform: {
					local: { position: new Vector3(0,0.0,0.2) }
				},
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
				transform: {
					local: { position: new Vector3(0,0.0,0.2) }
				},
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

		this.loadSound(`${this.baseUrl}/long_sine.wav`);
		this.loadSound(`${this.baseUrl}/long_saw.wav`);

		this.rightSoundHand = new SoundHand("right", this.context,this.assets);
		this.rightSoundHand.playSound(this.ourSounds[0]);
		this.rightSoundHand.playSound(this.ourSounds[1]);

		this.leftSoundHand = new SoundHand("left", this.context,this.assets);
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
			this.ourRightHand = this.findClosestHand(this.allRightHands);
			this.ourLeftHand = this.findClosestHand(this.allLeftHands);
		}, 1000); //fire every 1 sec
	}
}
