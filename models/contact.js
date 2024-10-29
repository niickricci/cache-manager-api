import Model from './model.js';

export default class Contact extends Model {
    constructor() {
        super(true);

        this.addField('Name', 'string');
        this.addField('Phone', 'phone');
        this.addField('Email', 'email');
        this.addField('Avatar', 'asset');

        this.setKey("Name");
    }
}