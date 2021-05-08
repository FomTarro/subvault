function hasUserSession(req){
    return req.session && req.session.passport && req.session.passport.user;
}

module.exports.hasUserSession = hasUserSession;