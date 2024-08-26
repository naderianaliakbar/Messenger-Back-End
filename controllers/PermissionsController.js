import Controllers      from '../core/Controllers.js';
import PermissionsModel from '../models/PermissionsModel.js';

class PermissionsController extends Controllers {
    static model = new PermissionsModel();

    constructor() {
        super();
    }

    static async initDefaultPermissions() {
        try {

            let admin = {
                "title": "adminsDefaultPermissions",
                "type" : "collective",
                "label": "admins",
                "urls" : {
                    "/api/users": {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                }
            };

            let user = {
                "title": "usersDefaultPermissions",
                "type" : "collective",
                "label": "users",
                "urls" : {
                    "/api/contacts": {
                        "POST"  : true,
                        "GET"   : true,
                        "PUT"   : true,
                        "DELETE": true
                    },
                    "/api/conversations": {
                        "POST": true,
                        "GET": true,
                        "PUT": true,
                        "DELETE": true
                    },
                },
            };

            let adminsPermission = await this.model.item({
                title: 'adminsDefaultPermissions',
                type : 'collective',
                label: 'admins'
            }).catch((error) => {
                // do nothing
            });

            let usersPermission = await this.model.item({
                title: 'usersDefaultPermissions',
                type : 'collective',
                label: 'users'
            }).catch((error) => {
                // do nothing
            });

            // insert users permission
            if (!usersPermission) {
                await this.model.insertOne(user);
            } else {
                if (usersPermission.urls !== user.urls) {
                    usersPermission.urls = user.urls;
                    await usersPermission.save();
                }
            }

            // insert users permission
            if (!adminsPermission) {
                await this.model.insertOne(admin);
            } else {
                if (adminsPermission.urls !== admin.urls) {
                    adminsPermission.urls = admin.urls;
                    await adminsPermission.save();
                }
            }

        } catch (error) {
            console.log('error in setting default permissions');
            throw error;
        }
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                title : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                status: 'active',
                _user : $input.user.data._id
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static addUsersDefaultPermissions() {
        return new Promise((resolve, reject) => {

            // admins
            this.model.insertOne({
                title: 'usersDefaultPermissions',
                type : 'collective',
                label: 'admins',
                urls : {
                    '/api/units': {
                        POST  : true,
                        GET   : true,
                        PUT   : true,
                        DELETE: true
                    }
                }
            });

            // users
            this.model.insertOne({
                title: 'usersDefaultPermissions',
                type : 'collective',
                label: 'users',
                urls : {}
            });

        });
    }

    static getUsersDefaultPermissions() {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item({
                label: 'users'
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static get($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }
}

export default PermissionsController;
