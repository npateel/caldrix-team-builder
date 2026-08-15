# Use VERCEL for hosting environment

## Problem statement
We need to quickly host apps for this takehome. Vercel allows us to 

1. Push to git branch
2. Test on preview
3. Deploy to production on merge
4. Largely compatible with many AI tools already

As I understand it, notion currently runs entirely using vercel today.

I don't really have time to worry about CI/CD, so this all-in-one solution is perfect here

## Assumptions

1. We only need to stand this up for maybe a week
2. Time to deploy is more important than scale here

## Alternatives considered

1. Netlify -- too static heavy
2. Cloudflare Pages + workers -- seemed to take a little more setup
3. Fly.io -- have to pay
4. DigitalOcean -- I don't want to do containers
5. AWS Amplify -- paid
