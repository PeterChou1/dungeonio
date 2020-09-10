// utilities functions


export const createanims = (scene, anims) => {
    anims.forEach((anim) => {
        anim.frames = scene.anims.generateFrameNumbers(...anim.frames)
        scene.anims.create(anim);
    })
}