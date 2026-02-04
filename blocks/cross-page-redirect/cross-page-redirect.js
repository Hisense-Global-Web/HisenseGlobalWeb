export default function decorate(block) {
    const [ crossWrapper ]  = block;
    crossWrapper.children.forEach(child => {
        console.log(child);
        
    });
}