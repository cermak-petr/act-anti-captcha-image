# act-anti-captcha-image

Act for solving image captchas using the anti-captcha.com service.
You need to have an anti-captcha subscription to be able to use it.

__The act accepts input in the following format:__
```javascript
{ 
    "key": ANTI_CAPTCHA_KEY,
    "imageUrl": CAPTCHA_IMAGE_URL 
}
```

Output is the recognized string.
