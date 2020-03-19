/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Context } from '@microsoft/mixed-reality-extension-sdk';
/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
    private context;
    private baseUrl;
    private assets;
    private ourRightHand;
    private ourLeftHand;
    private ourRightSound;
    private ourLeftSound;
    private ourSounds;
    private currentRightPitch;
    private currentLeftPitch;
    private userID;
    private counter;
    constructor(context: Context, baseUrl: string);
    /**
     * Called when a user leaves the application (probably left the Altspace world where this app is running).
     * @param user The user that left the building.
     */
    private userLeft;
    private playSound;
    private userJoined;
    /**
     * Once the context is "started", initialize the app.
     */
    private started;
}
//# sourceMappingURL=app.d.ts.map