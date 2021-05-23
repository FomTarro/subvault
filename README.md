# The Subscriber Vault
[https://subvault.net](https://www.subvault.net)

## About

The *Subscriber Vault* is a website that allows authorized users to upload files that are then accessible by anyone who subscribes to them on Twitch. 

The site is currently in closed beta, meaning that only select authorized Twitch users have upload permission. So, if you're interested in getting upload permission, [please Tweet at or DM the webmaster](#Contact).

## Technical Details

The backend of this site is a pretty straightforward Node.js Express server. Several peices of additional Express middleware have been used to help mitigate potential DDOS attacks and to help facilitate file upload, namely [`express-fileupload`](https://www.npmjs.com/package/express-fileupload) and [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit). 

The site uses Twitch single-sign-on (SSO) to verify user accounts, ensuring that only suscribers have download permission,and that only authorized users have upload permission.

The files are then hosted on a non-public S3 bucket. While the webmaster has personal qualms about supporting Amazon as a company, he figures that if we're already in the Twitch ecosystem, we might as well make the most of it.

## Contact

This site is owned, built and managed by Tom "Skeletom" Farro. If you need to contact him, the best way to do so is via [Twitter](https://www.twitter.com/fomtarro) or by leaving an issue ticket on this repo.