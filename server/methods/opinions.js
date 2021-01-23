import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import { Opinions } from '../../imports/api/collections/opinions';

import { hasPermission } from '../../imports/api/helpers/roles';
import { escapeRegExp } from '../../imports/api/helpers/basics';

import opinionDocumenter from 'opinion-documenter';
import { OpinionDetails } from '../../imports/api/collections/opinionDetails';
import { OpinionPdfs } from '../../imports/api/collections/opinion-pdfs';

import fs from 'fs';
import path from 'path';

const readFile = Meteor.wrapAsync(fs.readFile, fs);
const writePdf = Meteor.wrapAsync(OpinionPdfs.write, OpinionPdfs);

const settings = JSON.parse(process.env.MGP_SETTINGS);

Meteor.methods({
    /**
     * Returns all Opinions that are shared with the current user
     * 
     * @param {String} searchText Specifies a searchText
     */
    'opinions.getSharedOpinions'(searchText){
        if (searchText !== undefined && searchText !== null) {
            check(searchText, String);
        }

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        const escapedText = escapeRegExp(searchText);
        
        // check if opinion was sharedWith the current User
        const shared = Opinions.find({
            $and: [
                { "sharedWith.user.userId": this.userId },
                { $or: [
                    { 'title': { $regex : escapedText, $options:"i" } },
                    { 'description': { $regex : escapedText, $options:"i" } },
                    { 'opinionNo': { $regex : escapedText, $options:"i" } },
                    { 'customer.name': { $regex : escapedText, $options:"i" } },
                ]}
            ]
        }).map( o => {
            const calcTitle = o.customer
                ? o.title + ' Nr. ' + o.opinionNo + ' (' + o.customer.name + ' ' + o.customer.city + ')'
                : o.title;

            return {
                _id: o._id,
                title: calcTitle
            }
        });
        
        return shared;
    },

    /**
     * Creates a new PDF for the given Opinion and store the
     * file in the files collection to get a secure download
     * 
     * @param {String} refOpinion Specifies the ID of the opinion
     */
    async 'opinion.createPDF'(refOpinion) {
        check(refOpinion, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        const currentUser = Meteor.users.findOne(this.userId);

        // ... and check then if the current-user is member of sharedWith
        const opinion = Opinions.findOne({
            _id: refOpinion,
            'sharedWith.user.userId': this.userId
        });

        if (!opinion) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt und Sie können daher kein PDF erzeugen.');
        }

        const sharedWithRole = opinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten (Erstellen eines PDF) des angegebenen Gutachtens.');
        }

        const details = OpinionDetails.find({
            refOpinion,
            deleted: false,
            finallyRemoved: false
        }).fetch();
        
        const filename = path.join(settings.PdfPath, `${opinion.opinionNo}.pdf`);
        /*const filename = */await opinionDocumenter.pdfCreate(opinion, details, settings.PdfPath);

        const data = readFile(filename);

        const fileRef = writePdf(data, {
            fileName: `${refOpinion}.pdf`,
            type: 'application/pdf',
            meta: {
                refOpinion, 
                createdAt: new Date(), 
                createdBy: {
                    userId: currentUser._id,
                    firstName: currentUser.userData.firstName,
                    lastName: currentUser.userData.lastName
                }
            }
        });

        fs.unlinkSync(filename);
        fs.unlinkSync(filename.replace('.pdf', '.tmp.pdf'));
    }
});