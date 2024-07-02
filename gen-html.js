const fs = require('fs');

if (process.argv.length !== 4) {
    console.log('Usage: node gen-html.js 《source-folder》《outfile》');
    process.exit(1);
}
const sourceFolder = process.argv[2].endsWith('/') 
    ? process.argv[2]
    : process.argv[2] + '/';
const outfile = process.argv[3];

const outStream = fs.createWriteStream(outfile, { encoding: 'utf8' });
try {
	outStream.write(htmlTop());
	fs.readdirSync(sourceFolder)
		.sort((a, b) => b.localeCompare(a))
		.forEach(file => outStream.write(day(sourceFolder + file)));
	outStream.write(htmlBottom());
} finally {
	outStream.close();
}

function htmlTop() {
	return '<!doctype html>'
		+ '<html>' 
		+ '<head><meta charset="UTF-8">\r\n' 
		+ '<title>Slack channel archive</title>\r\n' 
		+ '<style>\r\n'
		+ 'body { display: flex; justify-content: center; font-family: sans-serif; font-size: smaller; line-height: 150%; background-color: #101010; color: #DDD; }\r\n' 
        + 'p { margin-block: 0 }\r\n' 
		+ '.container { width: 1000px; }\r\n' 
		+ '.date { margin: 30px auto 10px; font-size: larger; color: #EEE; }\r\n' 
		+ '.message { display: flex; margin-bottom: 5px; }\r\n' 
		+ '.user { min-width: 200px; max-width: 200px; color: #BBB; }\r\n' 
		+ '.attachments { margin-top: 5px; }\r\n' 
		+ '.thumb { height: 100px; width: 100px; object-fit: cover; border-radius: 5px; }\r\n' 
		+ 'a { color: lightsteelblue; }\r\n' 
		+ 'a:visited { color: lightslategrey; }\r\n' 
		+ 'a.attachment { margin-right: 5px; }\r\n' 
		+ '</style>\r\n'
		+ '</head>'
		+ '<body>\r\n'
		+ '<div class="container">'
}

function htmlBottom() {
	return '</div></body></html>\r\n';
}

function day(file) {
	const date = file.match(/.*(\d\d\d\d-\d\d-\d\d)/)[1];
	let result = `<div class="day"><div class="date">${date}</div>\r\n`;
	const content = JSON.parse(fs.readFileSync(file, 'utf8'));
	content
		.filter(m => m.type === 'message' && !m.subtype)
		.filter(m => m.text)
		.forEach(m => {
			result += message(m);
		});
	return result + '</div>\r\n';
}

function message(message) {
	return '<div class="message">'
		+ `<div class="user">${username(message.user_profile)}</div>`
		+ '<div class="content">'
		+ `<div class="text">${text(message.text)}</div>`
		+ attachments(message.attachments)
		+ '</div>'
		+ '</div>\r\n';
}

function username(profile) {
	return profile?.display_name || profile?.real_name || profile?.name || '<unknown>';
}

function text(src) {
	let text = src;
	let match;
	while (match = text.match(/<(http.*?)>/)) {
		text = text.substring(0, match.index) 
		+ `<a href="${match[1]}" target="_blank">${hostname(match[1])}</a>` 
		+ text.substring(match.index + match[0].length);
	}
    const paragraphs = text.split('\n');
    return '<p>' + paragraphs.join('</p><p>') + '</p>';
}

function hostname(url) {
	return url.match(/.*:\/\/(.*?)($|\/)/)[1] || 'Link';
}

function attachments(attachments) {
	const filtered = (attachments || []).filter(a => a.thumb_url || a.image_url);
	if (filtered.length === 0) {
		return '';
	}
	return '\r\n<div class="attachments">'
		+ filtered.map(a => attachment(a)).join('')
		+ '</div>\r\n\r\n';
}

function attachment(attachment) {
	const imageUrl = attachment.image_url || attachment.thumb_url;
	return `<a class="attachment" href="${attachment.title_link}" target="_blank">`
		+ `<img class="thumb" src="${imageUrl}" />`
		+ '</a>';
}