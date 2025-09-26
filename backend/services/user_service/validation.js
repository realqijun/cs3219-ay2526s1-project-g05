// User validation rules and utilities
export const USER_VALIDATION_RULES = {
    username: {
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_-]+$/,
        reservedWords: ['admin', 'root', 'system', 'api', 'www', 'mail', 'support'],
        description: 'Username must be 3-20 characters, alphanumeric with underscore/dash only'
    },
    password: {
        minLength: 8,
        maxLength: 30,
        description: 'Password must be 8-30 characters'
    },
    email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        maxLength: 254,
        description: 'Must be a valid email address'
    }
};

export class UserValidator {
    static validateUsername(username) {
        const rules = USER_VALIDATION_RULES.username;
        const errors = [];

        if (!username || typeof username !== 'string') {
            errors.push('Username is required');
            return { valid: false, errors };
        }

        if (username.length < rules.minLength) {
            errors.push(`Username must be at least ${rules.minLength} characters`);
        }

        if (username.length > rules.maxLength) {
            errors.push(`Username must be no more than ${rules.maxLength} characters`);
        }

        if (!rules.pattern.test(username)) {
            errors.push('Username can only contain alphanumeric characters with underscore/dash only');
        }

        if (rules.reservedWords.includes(username.toLowerCase())) {
            errors.push('This username is reserved and cannot be used');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validatePassword(password) {
        const rules = USER_VALIDATION_RULES.password;
        const errors = [];

        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
            return { valid: false, errors };
        }

        if (password.length < rules.minLength) {
            errors.push(`Password must be at least ${rules.minLength} characters`);
        }

        if (password.length > rules.maxLength) {
            errors.push(`Password must be no more than ${rules.maxLength} characters`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validateEmail(email) {
        const rules = USER_VALIDATION_RULES.email;
        const errors = [];

        if (!email || typeof email !== 'string') {
            errors.push('Email is required');
            return { valid: false, errors };
        }

        if (email.length > rules.maxLength) {
            errors.push(`Email must be no more than ${rules.maxLength} characters`);
        }

        if (!rules.pattern.test(email)) {
            errors.push('Please enter a valid email address');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    static validateUser(userData) {
        const { username, email, password } = userData;

        const usernameValidation = this.validateUsername(username);
        const emailValidation = this.validateEmail(email);
        const passwordValidation = this.validatePassword(password);

        const allErrors = [
            ...usernameValidation.errors,
            ...emailValidation.errors,
            ...passwordValidation.errors
        ];

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            details: {
                username: usernameValidation,
                email: emailValidation,
                password: passwordValidation
            }
        };
    }
}