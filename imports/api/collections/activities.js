import { Mongo } from 'meteor/mongo';

import SimpleSchema from  'simpl-schema';

import { CreationSchema } from '../sharedSchemas/user';

export const ActivitySchema = new SimpleSchema({
    refOpinion: {
        type: String,
        label: 'Gutachten-Referenz'
    },
    refDetail: {
        type: String,
        label: 'Gutachten-Referenz auf Detailpunkt',
        optional: true
    },
    /*refOpinionLayerA: {
        type: String,
        label: 'Gutachten-Referenz auf Unterpunkt A',
        optional: true
    },
    refOpinionLayerB: {
        type: String,
        label: 'Gutachten-Referenz auf Unterpunkt B',
        optional: true
    },*/
    type: {
        type: String // USER-POST, SYSTEM-LOG
    },
    message: {
        type: String,
        label: 'Aktivitätsnachricht'
    },
    feedback: {
        type: Array,
        optional: true
    },
    "feedback.$": {
        type: Object
    },
    response: {
        type: Array,
        optional: true
    },
    "response.$": {
        type: Object
    },
});

ActivitySchema.extend(CreationSchema);

export const Activities = new Mongo.Collection('activities');
Activities.attachSchema(ActivitySchema);
