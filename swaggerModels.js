/**
 * @swagger
 * components:
 *   schemas:
 *     Business:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: The ID of the user who owns the business.
 *         name:
 *           type: string
 *           description: The name of the business.
 *         type:
 *           type: string
 *           description: The type of business.
 *         address:
 *           type: string
 *           description: The address of the business.
 *         description:
 *           type: string
 *           description: A description of the business.
 *         logo:
 *           type: string
 *           description: The URL of the business logo.
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of amenities offered by the business.
 *         cacDoc:
 *           type: string
 *           description: The CAC document of the business.
 *         plan:
 *           type: string
 *           enum: [free, premium]
 *           description: The subscription plan of the business.
 *         hours:
 *           type: object
 *           description: The operating hours of the business.
 *         social:
 *           type: object
 *           description: Social media links for the business.
 *         wifi:
 *           type: array
 *           items:
 *             type: string
 *           description: List of Wi-Fi networks available at the business.
 *     User:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: The user's first name.
 *         lastName:
 *           type: string
 *           description: The user's last name.
 *         username:
 *           type: string
 *           description: The user's username.
 *         email:
 *           type: string
 *           description: The user's email address.
 *         password:
 *           type: string
 *           description: The user's password.
 *         phone_number:
 *           type: string
 *           description: The user's phone number.
 *         picture:
 *           type: string
 *           description: The URL of the user's profile picture.
 *         bio:
 *           type: string
 *           description: A short biography of the user.
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of the user's interests.
 *         userType:
 *           type: string
 *           description: The type of user (e.g., individual, business).
 *         followersCount:
 *           type: integer
 *           description: The number of followers the user has.
 *         followingCount:
 *           type: integer
 *           description: The number of users the user is following.
 *         profession:
 *           type: string
 *           description: The user's profession.
 *         skills:
 *           type: string
 *           description: The user's skills.
 *         gender:
 *           type: string
 *           description: The user's gender.
 *         resetPasswordOTP:
 *           type: integer
 *           description: OTP for resetting the password.
 *         resetPasswordExpires:
 *           type: string
 *           description: Expiration time for the reset password OTP.
 *         location:
 *           type: string
 *           description: The user's location.
 *         placesVisited:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of places the user has visited.
 *     Post:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: The ID of the user who created the post.
 *         businessId:
 *           type: integer
 *           description: The ID of the business associated with the post.
 *         description:
 *           type: string
 *           description: The content of the post.
 *         postType:
 *           type: string
 *           enum: [individual, business]
 *           description: The type of post.
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of users who liked the post.
 *         media:
 *           type: array
 *           items:
 *             type: string
 *           description: Media associated with the post.
 *         rating:
 *           type: number
 *           description: The rating of the post.
 *         ratingsCount:
 *           type: integer
 *           description: The number of ratings the post has received.
 *         bookmarks:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of users who bookmarked the post.
 *     Comment:
 *       type: object
 *       properties:
 *         postId:
 *           type: integer
 *           description: The ID of the post the comment belongs to.
 *         authorId:
 *           type: integer
 *           description: The ID of the user who authored the comment.
 *         content:
 *           type: string
 *           description: The content of the comment.
 *         parentId:
 *           type: integer
 *           description: The ID of the parent comment if this is a reply.
 *     Notification:
 *       type: object
 *       properties:
 *         recipientId:
 *           type: integer
 *           description: The ID of the user receiving the notification.
 *         senderId:
 *           type: integer
 *           description: The ID of the user sending the notification.
 *         type:
 *           type: string
 *           enum: [follow, unfollow, mention, like, comment]
 *           description: The type of notification.
 *         message:
 *           type: string
 *           description: The notification message.
 *         read:
 *           type: boolean
 *           description: Indicates if the notification has been read.
 *         metadata:
 *           type: object
 *           description: Additional information related to the notification.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The time the notification was created.
 *     Image:
 *       type: object
 *       properties:
 *         postId:
 *           type: integer
 *           description: The ID of the post the image belongs to.
 *         fileName:
 *           type: string
 *           description: The name of the image file.
 *         filePath:
 *           type: string
 *           description: The path where the image is stored.
 *     BusinessFollowers:
 *       type: object
 *       properties:
 *         followerId:
 *           type: integer
 *           description: The ID of the user who follows the business.
 *         followedId:
 *           type: integer
 *           description: The ID of the business being followed.
 *         followedAt:
 *           type: string
 *           format: date-time
 *           description: The time the follow action occurred.
 *     BusinessPosts:
 *       type: object
 *       properties:
 *         media:
 *           type: array
 *           items:
 *             type: string
 *           description: Media associated with the business post.
 *         postText:
 *           type: string
 *           description: The content of the business post.
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: A list of users who liked the business post.
 *         businessId:
 *           type: integer
 *           description: The ID of the business associated with the post.
 *     WifiScan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The ID of the Wi-Fi scan.
 *         userId:
 *           type: integer
 *           description: The ID of the user associated with the scan.
 *         businessId:
 *           type: integer
 *           description: The ID of the business associated with the scan.
 *         wifiName:
 *           type: string
 *           description: The name of the Wi-Fi network.
 *         location:
 *           type: object
 *           description: Location data for the Wi-Fi scan.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The time the Wi-Fi scan was created.
 *     ZoneBusiness:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the business zone.
 *         address:
 *           type: string
 *           description: The address of the business zone.
 *         latitude:
 *           type: number
 *           description: The latitude coordinate.
 *         longitude:
 *           type: number
 *           description: The longitude coordinate.
 *         category:
 *           type: string
 *           description: The category of the business.
 *         zone:
 *           type: string
 *           description: The zone designation.
 *         registered:
 *           type: boolean
 *           description: Indicates if the business is registered.
 *         verified:
 *           type: boolean
 *           description: Indicates if the business is verified.
 *         radius:
 *           type: integer
 *           description: The radius in meters for the zone.
 */
