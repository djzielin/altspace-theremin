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
	Sound,
	Guid
} from '@microsoft/mixed-reality-extension-sdk';
//import { userInfo } from 'os';

//import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { log } from '@microsoft/mixed-reality-extension-sdk/built/log';

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private assets: AssetContainer;
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
		this.assets = new AssetContainer(context);

		this.context.onStarted(() => this.started());
		this.context.onUserLeft(user => this.userLeft(user));
		this.context.onUserJoined(user => this.userJoined(user));
	}


	/**
	 * Called when a user leaves the application (probably left the Altspace world where this app is running).
	 * @param user The user that left the building.
	 */
	private userLeft(user: User) {
		log.info("app", "user left: " + user.name);
	}

	private playSound(label: string, handPos: Vector3, soundActor: Actor) {
		let tempPos = handPos.clone(); 
		let height = tempPos.y;
		tempPos.y = 0; //ignore height off the ground
		const ourDist = tempPos.length();
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

		log.info("app", "userid: " + user.id);

		//if (user.id !== "55e777e3-a124-5c61-2d20-b37898687186") {
		//	log.info("app", "user that joined was not Dave!");
		//	return;
		//}

		this.userID = user.id;

		this.ourRightHand = Actor.Create(this.context, {
			actor: {
				attachment: {
					attachPoint: 'right-hand',
					userId: this.userID
				}
			}
		});

		this.ourRightHand.subscribe('transform');

		this.ourLeftHand = Actor.Create(this.context, {
			actor: {
				attachment: {
					attachPoint: 'left-hand',
					userId: this.userID
				}
			}
		});

		this.ourLeftHand.subscribe('transform');

		setInterval(() => {
			this.playSound("right", this.ourRightHand.transform.app.position, this.ourRightSound);
			this.playSound("left ", this.ourLeftHand.transform.app.position, this.ourLeftSound);
		}, 50); //50
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		let newSound;

		//const gltf = await this.assets.loadGltf(`${this.baseUrl}/altspace-cube.glb`, 'box');
		let i = 1;
		for (; i < 51; i++) {
			const filename = `${this.baseUrl}/saw_` + i.toString() + ".wav";
			log.info("app", "trying to load filename: " + filename);


			newSound = this.assets.createSound("dave sound" + i.toString(), {
				uri: filename
			});

			this.ourSounds.push(newSound);
			log.info("app", "   done!");
		}

		this.ourRightSound = Actor.Create(this.context);
		this.ourLeftSound = Actor.Create(this.context);

		log.info("app", "about to create the pole");
		const circle = this.assets.createCylinderMesh('circle', 6.0, 0.1, 'y', 16);
		const ourPole = Actor.Create(this.context, {
			actor: {
				name: 'the pole',
				appearance: { meshId: circle.id }
			}
		});
	}
}
