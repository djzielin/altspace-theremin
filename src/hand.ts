/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

//import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as MRE from '../../mixed-reality-extension-sdk/packages/sdk'; //using our modded version of MRE
import { Vector3 } from '../../mixed-reality-extension-sdk/packages/sdk';

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

	public computeFlatDistance(ourVec: MRE.Vector3, ourVec2: MRE.Vector3) {
		const tempPos = ourVec.clone();
		const tempPos2=ourVec2.clone();
		tempPos.y = 0; //ignore height off the ground
		tempPos2.y=0;
		return (tempPos.subtract(tempPos2)).length();
	}

	public playSound(theSound: MRE.Sound) {
		const soundInstance: MRE.MediaInstance = this.soundActor.startSound(theSound.id, {
			doppler: 0,
			pitch: 0.0,
			looping: true,
			volume: 0.0
		});

		this.playingSounds.push(soundInstance); //store for later use
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

	public updateSound(handPos: MRE.Vector3) {
		const flatDist: number = this.computeFlatDistance(handPos,new Vector3(0,0,0));
		const distClamped: number = this.clampVal(flatDist,0.0,1.0);
		const ourHeight = this.clampVal(handPos.y + 0.5,0.0,1.0);

		const ourPitch = (1.0 - distClamped) * -30.0;
		let ourVol = ourHeight;

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

				this.cubeTarget = new Vector3(0,0,0);
				this.currentCube= this.visCubes.shift();
				this.currentCube.transform.local.position=handPos;	
				this.currentCube.appearance.material.color=
					new MRE.Color4(ourHeight, 1.0-ourHeight, 0.0, 1.0);			
				this.visCubes.push(this.currentCube); //add back to the end of the queue
			}
		}

		//for some reason waiting one frame gives time for position change take effect
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
