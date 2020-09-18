// utilities functions


export const createanims = (scene, anims) => {
    anims.forEach((anim) => {
        anim.frames = scene.anims.generateFrameNumbers(...anim.frames)
        const anims = scene.anims.create(anim);
        console.log('msPerFrame', anims.msPerFrame);
    })
}