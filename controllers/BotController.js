const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class BotController {
    // Helper function to generate Nigerian-style names
    static generateNigerianName() {
        console.log('[BOT] Generating Nigerian name...');
        
        const prefixes = ['Olu', 'Ade', 'Chi', 'Nne', 'Obi', 'Efe', 'Ife', 'Uche', 'Ola', 'Ama'];
        const stems = ['wale', 'tunde', 'nna', 'maka', 'dun', 'oma', 'chi', 'kachi', 'bimbo'];
        const suffixes = ['mi', 'de', 'ola', 'nna', 'chi', 'kwe', 'nma', 'gozi', 'dun', 'seun'];
        
        const name = prefixes[Math.floor(Math.random() * prefixes.length)] +
                     (Math.random() > 0.5 ? stems[Math.floor(Math.random() * stems.length)] : '') +
                     (Math.random() > 0.5 ? suffixes[Math.floor(Math.random() * suffixes.length)] : '');
        
        console.log(`[BOT] Generated name: ${name}`);
        return name;
    }

    // Helper function to parse media URLs
    static parseMedia(mediaString) {
        if (!mediaString) return [];
        try {
            if (mediaString.startsWith('[')) {
                return JSON.parse(mediaString.replace(/^"+|"+$/g, ''));
            }
            return mediaString.split(',').map(url => url.trim().replace(/^"+|"+$/g, ''));
        } catch (error) {
            console.error('[BOT] Error parsing media:', error);
            return [];
        }
    }

    // Helper function to generate image descriptions
    static async describeImages(imageUrls) {
        if (!imageUrls || imageUrls.length === 0) return [];
    
        console.log('[BOT] Generating image descriptions...');
        return await Promise.all(
            imageUrls.map(async (url) => {
                try {
                    // First download the image with the API key
                    const response = await fetch(url, {
                        headers: {
                            'x-api-key': '26a3281bfc65b39527447691941d6a707357a1278b1b2ec91742faec9de53ac8'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                    }
    
                    // Convert to buffer and then to base64
                    const buffer = await response.arrayBuffer();
                    const base64Image = Buffer.from(buffer).toString('base64');
                    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
                    // Send to OpenAI as base64
                    const aiResponse = await openai.chat.completions.create({
                        model: "gpt-4-turbo",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Describe this image in 10-15 words for a social media post." },
                                    { 
                                        type: "image_url", 
                                        image_url: {
                                            url: `data:${mimeType};base64,${base64Image}`
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 50
                    });
    
                    return { 
                        url, 
                        description: aiResponse.choices?.[0]?.message?.content?.trim() || "Description unavailable" 
                    };
                } catch (error) {
                    console.error(`[BOT] Error generating description for ${url}:`, error.message);
                    return { url, description: "Image description unavailable" };
                }
            })
        );
    }

    static async fetchAndLogPost(req, res) {
        console.log('[BOT] Starting post fetch...');
        
        try {
            const post = await sequelize.query(
                `SELECT * FROM posts ORDER BY createdAt DESC LIMIT 1`,
                { type: QueryTypes.SELECT }
            );

            if (!post || post.length === 0) {
                console.log('[BOT] No posts found');
                return res.status(404).json({ success: false, message: "No posts found" });
            }

            const recentPost = post[0];
            const author = await sequelize.query(
                `SELECT id, firstName, lastName FROM users WHERE id = :userId`,
                { replacements: { userId: recentPost.userId }, type: QueryTypes.SELECT }
            );

            const mediaUrls = BotController.parseMedia(recentPost.media);
            const mediaWithDescriptions = await BotController.describeImages(mediaUrls);
            
            let prompt = `Comment on this post: "${recentPost.description}"`;
            if (mediaWithDescriptions.length > 0) {
                prompt += `\n\nThe post includes these images: ${mediaWithDescriptions.map(m => m.description).join(', ')}`;
            }

            const aiResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Generate short social media comments." }, { role: "user", content: prompt }],
                max_tokens: 100
            });

            return res.status(200).json({
                success: true,
                post: {
                    id: recentPost.id,
                    content: recentPost.description,
                    author: author[0] ? `${author[0].firstName} ${author[0].lastName}` : 'Unknown',
                    createdAt: recentPost.createdAt,
                    media: mediaWithDescriptions
                },
                comment: {
                    text: aiResponse.choices[0].message.content.trim(),
                    author: BotController.generateNigerianName(),
                    type: "bot",
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('[BOT] Error:', error);
            return res.status(200).json({
                success: true,
                post: {},
                comment: {
                    text: "Interesting post!",
                    author: BotController.generateNigerianName(),
                    type: "bot",
                    generatedAt: new Date().toISOString()
                },
                warning: "Using fallback response"
            });
        }
    }

    static async generateCommentForPost(req, res) {
        console.log(`[BOT] Generating comment for post ${req.params.postId}`);
        
        try {
            const { postId } = req.params;
            const post = await sequelize.query(
                `SELECT * FROM posts WHERE id = :postId`,
                { replacements: { postId }, type: QueryTypes.SELECT }
            );

            if (!post || post.length === 0) {
                console.log(`[BOT] Post ${postId} not found`);
                return res.status(404).json({ success: false, message: "Post not found" });
            }

            const selectedPost = post[0];
            const author = await sequelize.query(
                `SELECT id, firstName, lastName FROM users WHERE id = :userId`,
                { replacements: { userId: selectedPost.userId }, type: QueryTypes.SELECT }
            );

            const mediaUrls = BotController.parseMedia(selectedPost.media);
            const mediaWithDescriptions = await BotController.describeImages(mediaUrls);

            let prompt = `Generate a Nigerian-style comment on: "${selectedPost.description}"`;
            if (mediaWithDescriptions.length > 0) {
                prompt += `\n\nThe post includes these images: ${mediaWithDescriptions.map(m => m.description).join(', ')}`;
            }

            const aiResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Write Nigerian social media comments." }, { role: "user", content: prompt }],
                max_tokens: 120,
                temperature: 0.8
            });

            return res.status(200).json({
                success: true,
                post: {
                    id: selectedPost.id,
                    content: selectedPost.description,
                    author: author[0] ? `${author[0].firstName} ${author[0].lastName}` : 'Unknown',
                    createdAt: selectedPost.createdAt,
                    media: mediaWithDescriptions
                },
                comment: {
                    text: aiResponse.choices[0].message.content.trim(),
                    author: BotController.generateNigerianName(),
                    type: "bot",
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('[BOT] Error:', error);
            return res.status(200).json({
                success: true,
                post: { id: req.params.postId },
                comment: {
                    text: "Na wa o! This post sweet me!",
                    author: BotController.generateNigerianName(),
                    type: "bot",
                    generatedAt: new Date().toISOString()
                },
                warning: "Using fallback response"
            });
        }
    }
}

module.exports = BotController;
