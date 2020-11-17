import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { OpinionDetails } from '../api/collections/opinionDetails';
import { Opinions } from '../api/collections/opinions';
import { Roles } from '../api/collections/roles';


export const useOpinionSubscription = id => useTracker( () => {
    const subscription = Meteor.subscribe('opinions', id)
    return !subscription.ready();
});

/**
 * Reactive current User Account
 */
export const useAccount = () => useTracker(() => {
    const user = Meteor.user();
    const userId = Meteor.userId();

    const subscription = Meteor.subscribe('currentUser');
    let currentUser = null;

    if (subscription.ready()) {
        currentUser = Meteor.users.findOne({_id:userId}, { fields: { username: 1, userData: 1 }});
    }

    return {
        user,
        userId,
        currentUser,
        isLoggedIn: !!userId,
        accountsReady: user !== undefined && subscription.ready()
    }
}, [])

/**
 * Reactive Roles handling
 * 
 */
export const useRoles = () => useTracker( () => {
    const noDataAvailable = [ [] /*Roles*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('roles');

    if (!subscription.ready()) { 
        return noDataAvailable;
    }

    const roles = Roles.find({}, { sort: {title: 1}}).fetch();

    return [roles, false];
});

/**
 * Load the given OpinionDetail reactivly.
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useOpinionDetail = (refOpinion, refDetail) => useTracker( () => {
    const noDataAvailable = [ null /*opinionDetail*/,  true /*loading*/ ];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const handler = Meteor.subscribe('opinionDetail', { refOpinion, refDetail });

    if (!handler.ready()) {
        return noDataAvailable;
    }

    detail = OpinionDetails.findOne(refDetail);

    return [detail, false];
}, [refOpinion, refDetail]);


/**
 * Load the given OpinionDetail reactivly.
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useOpinionDetails = (refOpinion, refParentDetail) => useTracker( () => {
    const noDataAvailable = [ [] /*opinionDetails*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const handler = Meteor.subscribe('opinionDetails', { refOpinion, refParentDetail });

    if (!handler.ready()) { 
        return noDataAvailable;
    }

    let opinionDetails;
    if (refParentDetail) {
        opinionDetails = OpinionDetails.find({ refParentDetail }, { sort: {orderString: 1}}).fetch();
    } else {
        opinionDetails = OpinionDetails.find({ refOpinion, refParentDetail: null }, { sort: {orderString: 1}}).fetch();
    }

    return [opinionDetails, false];
}, [refOpinion, refParentDetail]);