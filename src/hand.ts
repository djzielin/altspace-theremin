/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
//import colorsys from 'colorsys';

export default class SoundHand {
	private soundActor: MRE.Actor;
	private playingSounds: MRE.MediaInstance[] = [];
	private boxMesh: MRE.Mesh;
	private visCubes: MRE.Actor[] = [];
	private frameCounter=0;
	private currentCube: MRE.Actor=null;
	private cubeTarget: MRE.Vector3;


	constructor(private handName: string, private context: MRE.Context, private assets: MRE.AssetContainer) {
		this.soundActor = MRE.Actor.Create(context);
		this.boxMesh = this.assets.createBoxMesh('box', .02, 0.02, 0.02);

		for(let i=0;i<30;i++) {
			const ourMat: MRE.Material = this.assets.createMaterial('cube mat',{
				color: new MRE.Color4(1.0,1.0,1.0,1.0)
			});

			const ourBox = MRE.Actor.Create(this.context, {
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

	public computeFlatDistance(ourVec: MRE.Vector3) {
		const tempPos = ourVec.clone();
		tempPos.y = 0; //ignore height off the ground
		return tempPos.length();
	}

	public playSound(theSound: MRE.Sound) {
		const soundInstance: MRE.MediaInstance = this.soundActor.startSound(theSound.id, {
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

	private generateKeyframes(duration: number, endPos: MRE.Vector3): MRE.AnimationKeyframe[] {
		return [{
			time: 0 * duration,
			value: { transform: { local: { position: new MRE.Vector3(0, 0, 0) } } }
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
	public updateSound(handPos: MRE.Vector3) {
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

				this.cubeTarget = new MRE.Vector3(0, this.clampVal(handPos.y,-0.5,0.5), 0);

				this.currentCube= this.visCubes.shift();
				//for(const s in currentCube.animationsByName.keys())
				//	log.info("app","animations: " + s);

				this.currentCube.transform.local.position=handPos;
				
				//const values=colorsys.hsvToRgb(ourHeight,1.0,1.0); //TODO figure out HSV to RGB
				this.currentCube.appearance.material.color=new MRE.Color4(ourHeight, 1.0-ourHeight, 0.0, 1.0);

			
				this.visCubes.push(this.currentCube); //add back to the end of the queue
			}
		}
		if ((this.frameCounter - 1) % 3 === 0) {
			if (this.currentCube) {
				this.currentCube.animateTo({
					transform: {
						local: { position: this.cubeTarget }
					}
				}, 1.0 * flatDist, MRE.AnimationEaseCurves.Linear);
			}
		}
		this.frameCounter++;
	}
}
