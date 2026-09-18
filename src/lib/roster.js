/**
 * The school and teacher lists offered at sign-up.
 *
 * In one place because the sign-up form and the complete-your-profile screen
 * ask the same two questions, and keeping two copies meant adding a school
 * in one and forgetting the other — after which a student who signed up
 * could never match the profile screen's options.
 *
 * The backend stores whatever it is sent and validates neither, so these
 * lists are the only thing keeping the values consistent enough for the
 * teacher dashboard to group by.
 */
export const SCHOOLS = ['ESSS', 'BGSS', 'TWF']

export const TEACHERS = ['Mr Lloyd Goh', 'Ms Woo']
