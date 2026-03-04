export default function wrapInRichtext (block) {
    const wrapReg = '/\n/ig';
    console.log(block.textContent);
    
    block.textContent.replace(wrapReg, <br></br>);
}