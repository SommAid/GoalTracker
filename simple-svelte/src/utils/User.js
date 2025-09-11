import {ImportantDate} from './Date.js';

export class User {
    constructor(name='') {
        this.name = name;
        this.sign_up_date = new ImportantDate();
    }
}