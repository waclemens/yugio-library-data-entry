let selectedCards = [];
let cardHeight = 12.5;

const searchCardsByName = async (searchTerm) => {
	const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=' + searchTerm);
	const jsonResult = await res.json();

	return jsonResult.data;
};

const handleSearch = async (value) => {
	const cards = await searchCardsByName(value);
	let searchContainer = document.querySelector('.search-result-container');

	searchContainer.innerHTML = '';

	cards.forEach((card) => {
		addCard(searchContainer, card, false);
	});
};

const handleImgAddClick = (event) => {
	let card = JSON.parse(event.target.getAttribute('card-data'));

	card['uuid'] = uuid();
	selectedCards.push(card);
	generateSelection();

	localStorage.saveProgress = JSON.stringify(selectedCards);
};

const handleImgRemoveClick = (event) => {
	const card = JSON.parse(event.target.getAttribute('card-data'));
	let selectContainer = document.querySelector('.current-selected-cards-container');

	selectedCards = selectedCards.filter(selectedCard => selectedCard.uuid !== card.uuid);
	selectContainer.removeChild(event.target);
	generateSelection();

	localStorage.saveProgress = JSON.stringify(selectedCards);
};

const handleZoomClick = (event) => {
	const cardNodes = document.querySelectorAll('.card');
	const zoom = event.target.value;

	if(zoom === '+') {
		cardHeight *= 1.3;
		cardNodes.forEach((node) => {
			node.style.height = cardHeight + 'rem';
		});
	}
	else {
		cardHeight /= 1.3;
		cardNodes.forEach((node) => {
			node.style.height = cardHeight + 'rem';
		});
	}
};

const handleCsvDownloadClick = () => {
	const csvObj = generateCsv();

	Object.keys(csvObj).forEach((key) => {
		promptDownload(csvObj[key], key, '.csv');
	});
};

const handleJsonDownloadClick = () => {
	const jsonFile = 'data:text/json;charset=utf-8,' + JSON.stringify(selectedCards);

	promptDownload(jsonFile, 'library', '.json');
};

const addCard = (parent, card, isRemovable) => {
	let img = new Image();

	img.style.height = cardHeight + 'rem';
	img.classList.add('card');
	img.classList.add(isRemovable ? 'selected-card' : 'searched-card');
	img.src = card.card_images[0].image_url;
	img.setAttribute('card-data', JSON.stringify(card));
	img.setAttribute('draggable', false);
	img.addEventListener('click', isRemovable ? handleImgRemoveClick : handleImgAddClick);

	parent.appendChild(img);
};

const generateSelection = () => {
	let selectContainer = document.querySelector('.current-selected-cards-container');

	selectContainer.innerHTML = '';

	for(let i = selectedCards.length - 1; i >= 0; i--) {
		addCard(selectContainer, selectedCards[i], true);
	}
};

const promptDownload = (file, name, type) => {
	const encodedUri = encodeURI(file);
	let link = document.createElement('a');

	link.setAttribute('href', encodedUri);
	link.setAttribute('download', name + '.' + type);

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

const generateCsv = () => {
	const cardNodes = document.querySelectorAll('.selected-card');
	const monsterHeaders = ['name','attribute','level','atk','def','race','type','archetype','desc'];
	const spellTrapHeaders = ['name','race','archetype','desc'];

	let monsterCsv = 'data:text/csv;charset=utf-8,';
	let spellCsv = 'data:text/csv;charset=utf-8,';
	let trapCsv = 'data:text/csv;charset=utf-8,';

	monsterCsv += monsterHeaders.join(',') + '\r\n';
	spellCsv += spellTrapHeaders.join(',') + '\r\n';
	trapCsv += spellTrapHeaders.join(',') + '\r\n';

	cardNodes.forEach((node) => {
		const card = JSON.parse(node.getAttribute('card-data'));
		if(card.type.includes('Monster')) {
			const row = getFormattedCsvRow(card, monsterHeaders);
			monsterCsv += row.join(',') + '\r\n';
		}
		else if(card.type.includes('Spell Card')) {
			const row = getFormattedCsvRow(card, spellTrapHeaders);
			spellCsv += row.join(',') + '\r\n';
		}
		else if(card.type.includes('Trap Card')) {
			const row = getFormattedCsvRow(card, spellTrapHeaders);
			trapCsv += row.join(',') + '\r\n';
		}
	});

	return {monsters: monsterCsv, spells: spellCsv, traps: trapCsv};
};

const getFormattedCsvRow = (card, headers) => {
	let row = [];

	headers.forEach((header) => {
		let value = card[header];
		if(value){
			value = String(value);
			value = replaceAll(value,'"','""',true);
			value = value.replace(/(\r\n|\n|\r)/gm, ' ');
		} else {
			value = '';
		}
		row.push('"' + value + '"');
	});

	return row;
};

const replaceAll = (baseStr, str1, str2, ignore) => {
	return baseStr.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,'\\$&'),(ignore?'gi':'g')),(typeof(str2)=='string')?str2.replace(/\$/g,'$$$$'):str2);
};

const uuid = () => {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
};

window.addEventListener('load', async () => {
	const btnNodes = document.querySelectorAll('.zoom-btn');
	
	btnNodes.forEach((btn) => {
		btn.addEventListener("click", handleZoomClick);
	});

	selectedCards = JSON.parse(localStorage.saveProgress);
	generateSelection();
});
