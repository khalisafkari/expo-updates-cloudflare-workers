type Apps = {
    name: string;
    package: string;
    key: string;
    time: string;
}

export class ResponseUtils {
    static usersIfNotFound() {
        return {
            errors: {
                message: 'No data available for your account. Please check back later or contact support if you believe this is an error.'
            },
        }
    }

    static userIsCreate(users: { username: string; apiKey: string; expired_at: string | null; }) {
        return {
            users
        }
    }

    static userIsExpired() {
        return {
            errors: {
                message: 'Your account has expired.'
            }
        }
    }

    static usersNotMatchPassword() {
        return {
            errors: {
                message: `The password you entered is incorrect. Please try again or reset your password if you've forgotten it.`
            }
        }
    }

    static userIfReset() {
        return {
            users: {
                message: 'reset',
            }
        }
    }


    /// APPS

    static appsList(apps: Apps[]) {
        return {
            apps
        }
    }

    static appIfCreate(app: Apps) {
        return ResponseUtils.appsList([{
            name: app.name,
            key: app.key,
            package: app.package,
            time: app.time,
        }])
    }

    static appsNotFound() {
        return {
            errors: {
                message: 'Apps is NotFound'
            }
        }
    }

    static Forbidden() {
        return {
            errors: {
                message: 'Forbidden'
            }
        }
    }
}