"use strict";
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mixed_reality_extension_sdk_1 = require("@microsoft/mixed-reality-extension-sdk");
//import { userInfo } from 'os';
//import * as MRE from '@microsoft/mixed-reality-extension-sdk';
const log_1 = require("@microsoft/mixed-reality-extension-sdk/built/log");
/**
 * The main class of this app. All the logic goes here.
 */
class HelloWorld {
    constructor(context, baseUrl) {
        this.context = context;
        this.baseUrl = baseUrl;
        this.ourRightHand = null;
        this.ourLeftHand = null;
        this.ourRightSound = null;
        this.ourLeftSound = null;
        this.ourSounds = [];
        this.currentRightPitch = 0.0;
        this.currentLeftPitch = 0.0;
        this.counter = 0;
        this.assets = new mixed_reality_extension_sdk_1.AssetContainer(context);
        this.context.onStarted(() => this.started());
        this.context.onUserLeft(user => this.userLeft(user));
        this.context.onUserJoined(user => this.userJoined(user));
    }
    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    userLeft(user) {
        log_1.log.info("app", "user left: " + user.name);
    }
    playSound(label, handPos, soundActor) {
        let tempPos = handPos.clone();
        let height = tempPos.y;
        tempPos.y = 0; //ignore height off the ground
        const ourDist = tempPos.length();
        log_1.log.info("app", label + " dist: " + ourDist);
        log_1.log.info("app", "     height: " + height);
        const ourPitch = ourDist * -30.0;
        log_1.log.info("app", "     pitch: " + ourPitch);
        let indexID = 0;
        if (height > 1.0 && height < 2.0) {
            indexID = Math.trunc((height - 1.0) * 20.0);
        }
        if (height >= 2.0) {
            indexID = 20;
        }
        if (ourDist < 1.5) {
            soundActor.startSound(this.ourSounds[indexID].id, {
                doppler: 0,
                pitch: ourPitch
            });
        }
    }
    userJoined(user) {
        log_1.log.info("app", "userid: " + user.id);
        if (user.id !== "55e777e3-a124-5c61-2d20-b37898687186") {
            log_1.log.info("app", "user that joined was not Dave!");
            return;
        }
        this.userID = user.id;
        this.ourRightHand = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
            actor: {
                attachment: {
                    attachPoint: 'right-hand',
                    userId: this.userID
                }
            }
        });
        this.ourRightHand.subscribe('transform');
        this.ourLeftHand = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
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
    started() {
        let newSound;
        //const gltf = await this.assets.loadGltf(`${this.baseUrl}/altspace-cube.glb`, 'box');
        let i = 1;
        for (; i < 51; i++) {
            const filename = `${this.baseUrl}/saw_` + i.toString() + ".wav";
            log_1.log.info("app", "trying to load filename: " + filename);
            newSound = this.assets.createSound("dave sound" + i.toString(), {
                uri: filename
            });
            this.ourSounds.push(newSound);
            log_1.log.info("app", "   done!");
        }
        this.ourRightSound = mixed_reality_extension_sdk_1.Actor.Create(this.context);
        this.ourLeftSound = mixed_reality_extension_sdk_1.Actor.Create(this.context);
        log_1.log.info("app", "about to create the pole");
        const circle = this.assets.createCylinderMesh('circle', 6.0, 0.1, 'y', 16);
        const ourPole = mixed_reality_extension_sdk_1.Actor.Create(this.context, {
            actor: {
                name: 'the pole',
                appearance: { meshId: circle.id }
            }
        });
    }
}
exports.default = HelloWorld;
//# sourceMappingURL=app.js.map