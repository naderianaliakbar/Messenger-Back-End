import Controllers      from '../core/Controllers.js';
import InputsController from "./InputsController.js";
import UsersController  from "./UsersController.js";

class ContactsController extends Controllers {

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {

            }
        }

        return $row;
    }


    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // validate Input
            InputsController.validateInput($input, {
                firstName: {type: 'string', required: true},
                lastName : {type: 'string', required: true},
                phone    : {type: 'string', required: true}
            }).then(
                ($input) => {
                    // query to find user
                    UsersController.item({
                        phone: $input.phone
                    }).then(
                        (contactUser) => {
                            contactUser = contactUser.data;

                            // find the user self
                            UsersController.get($input.user.data._id, 'system').then(
                                (user) => {
                                    user = user.data;

                                    // found the contact
                                    let foundContact = user.contacts.find(
                                        contact => contact._user.toString() === contactUser._id.toString()
                                    );

                                    if (foundContact) {
                                        return reject({
                                            code: 400,
                                            data: {
                                                message: 'This contact has already been added'
                                            }
                                        });
                                    } else {
                                        // add the contact
                                        user.contacts.push({
                                            name : {
                                                first: $input.firstName,
                                                last : $input.lastName
                                            },
                                            _user: contactUser._id
                                        });

                                        user.save().then(
                                            (responseUserSave) => {
                                                return resolve({
                                                    code: 200
                                                });
                                            },
                                            (errorSaveUser) => {
                                                return reject({
                                                    code: 500,
                                                    data: {
                                                        message: 'Problem saving contacts'
                                                    }
                                                });
                                            }
                                        );
                                    }
                                }
                            );
                        },
                        (contactUserError) => {
                            // user not founded
                            if (contactUserError.code === 404) {
                                return reject({
                                    code: 400,
                                    data: {
                                        message: 'User Not Found'
                                    }
                                });
                            } else {
                                return reject(contactUserError);
                            }
                        }
                    );
                },
                (validationError) => {
                    return reject(validationError);
                }
            );
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

    static listOfContacts($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            let query = this.queryBuilder($input);

            let options = {
                sort      : $input.sort,
                projection: {
                    password: 0
                }
            };

            if ($input.pagination) {
                options.skip  = $input.offset;
                options.limit = $input.perPage;
            }

            // filter
            this.model.list(query, options).then(
                (response) => {
                    // get count
                    this.model.count(query).then(async (count) => {

                        // create output
                        for (const row of response) {
                            const index     = response.indexOf(row);
                            response[index] = await this.outputBuilder(row);
                        }

                        // return result
                        return resolve({
                            code: 200,
                            data: {
                                list : response,
                                total: count
                            }
                        });

                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static get($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id).then(
                async (response) => {
                    // reformat row for output
                    response = await this.outputBuilder(response.toObject());

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

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {}).then(
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

    static deleteOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($input).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject(response);
            });
        });
    }

}

export default ContactsController;
