const express = require('express');
const { createUser, checkEmail, mentorLogin, getLinkedInDetails } = require('../controllers/authControllers');

const router = express.Router();

router.route('/user/new').post(createUser);
router.route('/user/check/email').post(checkEmail);
router.route('/mentor/login').post(mentorLogin);
router.route('/mentor/linkedIn').post(getLinkedInDetails);


module.exports = router