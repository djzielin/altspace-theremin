/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

//import colorsys from 'colorsys';
import SoundHand from './hand'

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	private assets: MRE.AssetContainer;

	private rightSoundHand: SoundHand = null;
	private leftSoundHand: SoundHand = null;

	private allLeftHands = new Map();
	private ourLeftHand: MRE.Actor = null;

	private allRightHands = new Map();
	private ourRightHand: MRE.Actor = null;

	private ourSounds: MRE.Sound[] = [];
	private ourHands: MRE.Actor[] = [];
	private hand1: MRE.Actor;
	private hand2: MRE.Actor;

	private userID: string;
	private counter = 0;
	private handCounter=0;
	constructor(private context: MRE.Context, private baseUrl: string) {
		MRE.log.info("app", "our constructor started");
		this.assets = new MRE.AssetContainer(context);

		this.context.onStarted(() => this.started());
		this.context.onUserLeft(user => this.userLeft(user));
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private userJoined(user: MRE.User) {
		/*if(this.handCounter===0){
			MRE.log.info("app","skipping adding hand for: " + user.name);
			this.handCounter++;
			return;
		}*/
		MRE.log.info("app", "user joined. name: " + user.name + " id: " + user.id);

		const rHand = MRE.Actor.Create(this.context, {
			actor: {
				name: "rHand actor for user " + user.name,
				transform: {
					//app: { position: new MRE.Vector3(0,0.0,0.0)},
					local: { position: new MRE.Vector3(0,0.0,0.2) }
				},
				attachment: {
					attachPoint: 'right-hand',
					userId: user.id
				}
			}
		});
		if (rHand) {
			MRE.log.info("app", "   added their right hand");

			//if (this.handCounter === 1) {
				rHand.subscribe('transform');

				for (let i = 0; i < rHand.subscriptions.length; i++) {
					MRE.log.info("app", "     subscription: " + rHand.subscriptions[i]);
				}
				this.allRightHands.set(user.id, rHand);
				this.ourHands.push(rHand);
				if(this.handCounter===0){
					this.hand1=rHand;
				}else{
					this.hand2=rHand;
				}


			//}
		} else {
			MRE.log.info("app", "   ERROR during hand creation!!");
		}
/*
		const lHand = MRE.Actor.Create(this.context, {
			actor: {
				name: "lHand actor for user " + user.name,
				transform: {
					//app: { position: new MRE.Vector3(0,0.0,0.0)},
					local: { position: new MRE.Vector3(0,0.0,0.2) }
				},
				attachment: {
					attachPoint: 'left-hand',
					userId: user.id
				}
			}
		});
		
		if (lHand) {
			MRE.log.info("app", "   added their left hand");

			//if (this.handCounter === 1) {
				lHand.subscribe('transform');

				for (let i = 0; i < lHand.subscriptions.length; i++) {
					MRE.log.info("app", "     subscription: " + lHand.subscriptions[i]);
				}

				this.allLeftHands.set(user.id, lHand);
			//}
		} else {
			MRE.log.info("app", "   ERROR during hand creation!!");
		}
*/
		this.handCounter++;
	}

	private userLeft(user: MRE.User) {
		MRE.log.info("app", "user left. name: " + user.name + " id: " + user.id);

		const lHand: MRE.Actor = this.allLeftHands.get(user.id);
		if (lHand) {
			this.allLeftHands.delete(user.id)
			//lHand.destroy(); //why does this cause a bunch of errors to be thrown?
			MRE.log.info("app", "  succesfully remove left hand");
		} else {
			MRE.log.info("app", "  ERROR: no left hand found");
		}

		const rHand: MRE.Actor = this.allRightHands.get(user.id);
		if (rHand) {
			this.allRightHands.delete(user.id);
			//rHand.destroy(); //why does this cause a bunch of errors to be thrown?
			MRE.log.info("app", "  succesfully remove right hand");
		} else {
			MRE.log.info("app", "  ERROR: no right hand found");
		}
	}

	private findClosestHand(handName: string, handMap: Map<string, MRE.Actor>) {
		let closestDist = Infinity;
		let closestActor: MRE.Actor = null;
		let closestIndex=-1;
		let index=0;

		MRE.log.info("app","Trying to find closest " + handName);
		for (let hand of handMap.values()) {
			const hDist = this.rightSoundHand.computeFlatDistance(hand.transform.app.position);
			MRE.log.info("app","  examining user: " + index + " computed distance: " + hDist);
			if (hDist < closestDist) {
				closestDist = hDist;
				closestActor = hand;
				closestIndex = index;
			}

			for(let i=0;i<hand.subscriptions.length;i++)
			{
				MRE.log.info("app","    subscription: " + hand.subscriptions[i]);
			}
			index++;
		}
		MRE.log.info("app","  closest hand is user: " + closestIndex);		

		return closestActor;
	}

	private loadSound(filename: string) {
		MRE.log.info("app", "trying to load filename: " + filename);
		const newSound = this.assets.createSound("dave long sound", {
			uri: filename
		});
		if (newSound) {
			MRE.log.info("app", "   succesfully loaded sound!");
		}
		this.ourSounds.push(newSound);
	}

	private started() {
		MRE.log.info("app", "our started callback has begun");

		this.loadSound(`${this.baseUrl}/long_sine.wav`);
		this.loadSound(`${this.baseUrl}/long_saw.wav`);

		this.rightSoundHand = new SoundHand("right", this.context,this.assets);
		this.rightSoundHand.playSound(this.ourSounds[0]);
		this.rightSoundHand.playSound(this.ourSounds[1]);

		this.leftSoundHand = new SoundHand("left", this.context,this.assets);
		this.leftSoundHand.playSound(this.ourSounds[0]);
		this.leftSoundHand.playSound(this.ourSounds[1]);

		const circle = this.assets.createCylinderMesh('circle', 1.0, 0.01, 'y', 16);
		const ourPole = MRE.Actor.Create(this.context, {
			actor: {
				name: 'the pole',
				appearance: { meshId: circle.id }
			}
		});

		/*
		setInterval(() => {
			if (this.ourRightHand) {
				this.rightSoundHand.updateSound(this.ourRightHand.transform.app.position);
			}
			if (this.ourLeftHand) {
				this.leftSoundHand.updateSound(this.ourLeftHand.transform.app.position);
			}
		}, 30); //fire every 30ms
		*/

		//keep checking who has the closest hand to theremin. put that hand in charge
		setInterval(() => {
			/*let i=0;
			for(let hand of this.ourHands)
			{   hand.subscribe('transform');
				MRE.log.info("app","hand " + i + " + pos: " + hand.transform.app.position);
				i++;
			}*/
			MRE.log.info("app","hand0: " + this.hand1.transform.app.position);
			MRE.log.info("app","hand1: " + this.hand2.transform.app.position);
			this.hand1.subscribe('transform');
			this.hand2.subscribe('transform');
			//this.ourRightHand = this.findClosestHand("righthand",this.allRightHands);
			//this.ourLeftHand = this.findClosestHand("lefthand",this.allLeftHands);
		}, 1000); //fire every 1 sec
	}
}
