class Sender {

    static sendAuthSMS($code, $phone) {
        return new Promise(async (resolve, reject) => {
            // let $text = 'code:' + $code + '\n' + 'به فروشگاه زیرو خوش آمدید!';
            // let $text = "code:" + $code + "\n" + "به ExoRoya خوش آمدید!";

            let $text = `به ExoRoya خوش آمدید` + `\n code:${$code}`;

            let url = 'http://sms.parsgreen.ir/UrlService/sendSMS.ashx?from=10000010000019' +
                '&to=' + $phone +
                '&text=' + $text +
                '&signature=148F5677-2BBF-4DB1-BD8B-7F9C06BA8B27';

            await fetch(url, {
                method : 'get',
                headers: {
                    'Content-type': 'application/json'
                },
            }).then(
                (response) => {
                    if (response.status === 200) {
                        return resolve({
                            code: 200
                        });
                    } else {
                        return reject({
                            code: 500,
                            data: {
                                message: 'Error in send otp'
                            }
                        });
                    }
                },
                (error) => {
                    return reject({
                        code: 500,
                        data: {
                            message: 'Error in send otp'
                        }
                    });
                }
            );

            // fetch('https://login.niazpardaz.ir/SMSInOutBox/Send', {
            //     method : 'post',
            //     headers: {
            //         'Content-type': 'application/json'
            //     },
            //     body   : JSON.stringify({
            //         username: 'k.09139200357',
            //         password: 'hmv#120',
            //         from    : '10000100000',
            //         to      : $phone,
            //         message : $text,
            //     })
            // }).then(
            //     (response) => {
            //         return resolve({
            //             code: 200
            //         });
            //     },
            //     (reason) => {
            //         return reject({
            //             code: 500
            //         });
            //     });
        });
    }
}

export default Sender;
