interface Action {
    callback: (...args) => any | void,
    args: Array<any>

}


export class ActionQueue {
    items : Array<Action>;

    constructor() 
    { 
        this.items = []; 
    } 

    isEmpty() 
    { 
        // return true if the queue is empty. 
        return this.items.length == 0;  
    } 

    enqueue(element : Action) 
    {     
        // adding element to the queue 
        this.items.push(element); 
    }

    dequeue() : Action 
    { 
        if(this.isEmpty()) 
            return null; 
        return this.items.shift(); 
    }

    executeActions(){
        //console.log('executing actions');
        while(!this.isEmpty()){
            const { callback, args } = this.dequeue()
            console.log('execute action with args ', args);
            //console.log('with context ', context)
            callback(...args);
        }
    }
}

export function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}