// Rewrites the star and fork totals the 3D action renders.
//
// The action queries repositories with `ownerAffiliations: OWNER`, so those two
// figures cover personally-owned repositories only. This substitutes the totals
// that include the organisation, which is where the majority of them are.
//
// Both stats render as `<text ... class="fill-fg">N<title>N</title></text>`, in
// document order: stars first, forks second. The contribution total is excluded
// because it carries class="fill-strong", and it is correct already.
const fs = require('fs');
const path = require('path');

const [dir, stars, forks] = process.argv.slice(2);
if (!dir || !stars || !forks) {
    console.error('usage: patch-svg.js <dir> <stars> <forks>');
    process.exit(1);
}

const PATTERN = /(<text[^>]*class="fill-fg">)(\d+)(<title>)(\d+)(<\/title>)/g;

let files = 0;
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    const file = path.join(dir, name);
    const before = fs.readFileSync(file, 'utf8');

    const replacements = [stars, forks];
    let seen = 0;
    const after = before.replace(PATTERN, (whole, open, _v, titleOpen, _t, titleClose) => {
        if (seen >= replacements.length) return whole;
        const value = replacements[seen++];
        return `${open}${value}${titleOpen}${value}${titleClose}`;
    });

    // A future version of the action could change this markup. Failing loudly
    // beats silently republishing the personal-only figures.
    if (seen !== 2) {
        console.error(`::error::${name}: expected 2 stat nodes, matched ${seen}. Markup changed?`);
        process.exit(1);
    }

    fs.writeFileSync(file, after);
    files++;
}

if (files === 0) {
    console.error('::error::No SVGs found to patch.');
    process.exit(1);
}
console.log(`Patched ${files} SVGs to ${stars} stars / ${forks} forks.`);
