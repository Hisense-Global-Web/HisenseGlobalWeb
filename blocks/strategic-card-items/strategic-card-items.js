import {readBlockConfig} from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
export default function decorate(block) {
    const config = readBlockConfig(block);
    if (config.columns && isUniversalEditor()) {
        const addButton = document.querySelectorAll('button[aria-label="添加"]');
        if (config.columns > 1) {
            for (let index = 0; index < config.columns; index++) {
                addButton.click();
            }
        }
    }
}