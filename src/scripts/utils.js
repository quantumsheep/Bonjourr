//
//
// Vals
//
//

const id = (name) => document.getElementById(name)
const cl = (name) => document.getElementsByClassName(name)
const has = (dom, val) => {
	if (dom && dom.classList) if (dom.classList.length > 0) return dom.classList.contains(val)
	return false
}

const clas = (dom, add, str) => {
	if (add) dom.classList.add(str)
	else dom.classList.remove(str)
}

let stillActive = false
let rangeActive = false

const mobilecheck = () =>
	navigator.userAgentData
		? navigator.userAgentData.mobile
		: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const stringMaxSize = (string, size) => (string.length > size ? string.slice(0, size) : string)
const minutator = (date) => date.getHours() * 60 + date.getMinutes()

const randomString = (len) => {
	const chars = 'abcdefghijklmnopqr'
	return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function detectPlatform() {
	const p = window.location.protocol
	return p === 'moz-extension:'
		? 'firefox'
		: p === 'chrome-extension:'
		? 'chrome'
		: p === 'safari-web-extension:'
		? 'safari'
		: 'online'
}

const getBrowser = (agent = window.navigator.userAgent.toLowerCase()) => {
	return agent.indexOf('edg/' || 'edge') > -1
		? 'edge'
		: agent.indexOf('chrome') > -1
		? 'chrome'
		: agent.indexOf('firefox') > -1
		? 'firefox'
		: agent.indexOf('safari') > -1
		? 'safari'
		: 'other'
}

const getFavicon = () => {
	return getBrowser() === 'edge' ? 'monochrome.png' : 'favicon-128x128.png'
}

function periodOfDay(sunTime, time) {
	// Transition day and night with noon & evening collections
	// if clock is + /- 60 min around sunrise/set
	const { rise, set, now } = sunTime

	if (!time) time = now // no time specified ? get current from sunTime
	else time = minutator(new Date(time)) // everything is in minutes here

	if (time >= 0 && time <= rise - 60) return 'night'
	if (time <= rise + 60) return 'noon'
	if (time <= set - 60) return 'day'
	if (time <= set + 60) return 'evening'
	if (time >= set + 60) return 'night'

	return 'day'
}

function validateHideElem(hide) {
	let res = true

	Array.isArray(hide) && hide.length > 0
		? hide.forEach((parent) => {
				Array.isArray(parent)
					? parent.forEach((child) => {
							typeof child === 'number' ? '' : (res = false)
					  })
					: (res = false)
		  })
		: (res = false)

	return res
}

function localDataMigration(local) {
	if (!local.custom) return local

	let idsList = []
	Object.values(local.custom).forEach((val, i) => {
		const _id = randomString(6)
		idsList.push(_id)

		local = {
			...local,
			idsList,
			selectedId: _id,
			['custom_' + _id]: val,
			['customThumb_' + _id]: local.customThumbnails[i],
		}
	})

	delete local.custom
	delete local.customIndex
	delete local.customThumbnails

	return local
}

function bundleLinks(storage) {
	// 1.13.0: Returns an array of found links in storage
	let res = []
	Object.entries(storage).map(([key, val]) => {
		if (key.length === 11 && key.startsWith('links')) res.push(val)
	})

	res.sort((a, b) => a.order - b.order)
	return res
}

function slowRange(tosave, time = 400) {
	clearTimeout(rangeActive)
	rangeActive = setTimeout(function () {
		chrome.storage.sync.set(tosave)
	}, time)
}

function slow(that, time = 400) {
	that.setAttribute('disabled', '')
	stillActive = setTimeout(() => {
		that.removeAttribute('disabled')
		clearTimeout(stillActive)
		stillActive = false
	}, time)
}

function turnRefreshButton(button, canTurn) {
	const animationOptions = { duration: 600, easing: 'ease-out' }
	button.animate(
		canTurn
			? [{ transform: 'rotate(360deg)' }]
			: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }, { transform: 'rotate(0deg)' }],
		animationOptions
	)
}

function closeEditLink() {
	const domedit = document.querySelector('#editlink')
	clas(domedit, true, 'hiding')
	document.querySelectorAll('.l_icon_wrap').forEach((l) => (l.className = 'l_icon_wrap'))
	setTimeout(() => {
		domedit.setAttribute('class', '')
	}, 200)
}

// lsOnlineStorage works exactly like chrome.storage
// Just need to replace every chrome.storage

const lsOnlineStorage = {
	get: (local, unused, callback) => {
		const key = local ? 'bonjourrBackgrounds' : 'bonjourr'
		const data = localStorage[key] ? JSON.parse(localStorage[key]) : {}
		callback(data)
	},
	set: (prop, callback) => {
		lsOnlineStorage.get(null, null, (data) => {
			if (typeof prop === 'object') {
				const [key, val] = Object.entries(prop)[0]

				if (key === 'import') data = val
				else data[key] = val

				try {
					localStorage.bonjourr = JSON.stringify(data)
					if (callback) callback
				} catch (error) {
					console.warn(error)
					console.warn("Bonjourr couldn't save this setting 😅\nMemory might be full")
				}

				window.dispatchEvent(new Event('storage'))
			}
		})
	},
	clear: () => {
		localStorage.removeItem('bonjourr')
	},
	setLocal: (prop, callback) => {
		lsOnlineStorage.get(true, null, (data) => {
			if (typeof prop === 'object') {
				data = { ...data, ...prop }

				try {
					localStorage.bonjourrBackgrounds = JSON.stringify(data)
					if (callback) callback
				} catch (error) {
					console.log(error)
					console.log(console.warn("Bonjourr couldn't save this setting 😅\nMemory might be full"))
				}
			}
		})
	},
	remove: (isLocal, key) => {
		lsOnlineStorage.get(isLocal, null, (data) => {
			delete data[key]
			if (isLocal) localStorage.bonjourrBackgrounds = JSON.stringify(data)
			else localStorage.bonjourr = JSON.stringify(data)
		})
	},
	log: (isLocal) => lsOnlineStorage.get(isLocal, null, (data) => console.log(data)),
	del: () => localStorage.clear(),
}

const getBrowserStorage = () => {
	chrome.storage.local.get(null, (local) => {
		chrome.storage.sync.get(null, (sync) => console.log('local: ', local, 'sync: ', sync))
	})
}

const logsync = () =>
	chrome.storage.sync.get(null, (data) => Object.entries(data).forEach((elem) => console.log(elem[0], elem[1])))
const loglocal = () =>
	chrome.storage.local.get(null, (data) => Object.entries(data).forEach((elem) => console.log(elem[0], elem[1])))

function deleteBrowserStorage() {
	if (isExtension) {
		chrome.storage.sync.clear()
		chrome.storage.local.clear()
	}
	localStorage.clear()

	setTimeout(() => {
		location.reload()
	}, 400)
}

function errorMessage(comment, error) {
	function displayMessage(dataStr) {
		const warning = document.createElement('div')
		const title = document.createElement('h1')
		const subtitle = document.createElement('p')
		const errorcode = document.createElement('textarea')
		const explain = document.createElement('p')
		const resetButton = document.createElement('button')
		const closeError = document.createElement('button')
		const buttonWrap = document.createElement('div')

		title.textContent = comment + ' 😖'
		subtitle.textContent = `Copy your settings below and contact us !`
		explain.textContent =
			'Sharing your settings with us helps a lot in debugging. You can also reset Bonjourr, or close this window for now if you think it is a false alert.'

		explain.className = 'error-explain'

		errorcode.textContent = dataStr
		errorcode.setAttribute('spellcheck', 'false')

		resetButton.textContent = 'Reset Bonjourr'
		resetButton.addEventListener('click', () => {
			warning.style.opacity = 0
			deleteBrowserStorage()
		})

		closeError.className = 'error-buttons-close'
		closeError.textContent = 'Close this window'
		closeError.addEventListener('click', () => {
			sessionStorage.errorMessage = 'removed'
			warning.style.opacity = 0
			setTimeout(() => (warning.style.display = 'none'), 400)
		})

		buttonWrap.className = 'error-buttons'
		buttonWrap.appendChild(resetButton)
		buttonWrap.appendChild(closeError)

		warning.appendChild(title)
		warning.appendChild(subtitle)
		warning.appendChild(errorcode)
		warning.appendChild(explain)
		warning.appendChild(buttonWrap)

		warning.id = 'error'
		document.body.prepend(warning)

		dominterface.style.opacity = '1'

		setTimeout(() => (warning.style.opacity = 1), 20)
	}

	console.log(error)

	if (sessionStorage.errorMessage === 'removed') {
		dominterface.style.opacity = '1'
		return false
	} else {
		chrome.storage.sync.get(null, (data) => {
			try {
				displayMessage(JSON.stringify(data, null, 4))
			} catch (e) {
				displayMessage('', 'Could not load settings')
			}
		})
	}
}

const testOS = {
	mac: window.navigator.appVersion.includes('Macintosh'),
	windows: window.navigator.appVersion.includes('Windows'),
	android: window.navigator.userAgent.includes('Android'),
	ios:
		['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
		(navigator.userAgent.includes('Mac') && 'ontouchend' in document),
}

const safeFontList = {
	fallback: { placeholder: 'Arial', weights: [500, 600, 800] },
	windows: { placeholder: 'Segoe UI', weights: [300, 400, 600, 700, 800] },
	android: { placeholder: 'Roboto', weights: [100, 300, 400, 500, 700, 900] },
	linux: { placeholder: 'Fira Sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
	apple: { placeholder: 'SF Pro Display', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
}

const langList = {
	en: 'English',
	fr: 'Français',
	sk: 'Slovenský',
	sv: 'Svenska',
	pl: 'Polski',
	pt_BR: 'Português (Brasil)',
	nl: 'Nederlandse',
	ru: 'Русский',
	zh_CN: '简体中文',
	de: 'Deutsch',
	it: 'Italiano',
	es: 'Español',
	tr: 'Türkçe',
	uk: 'Українська',
	id: 'Indonesia',
	da: 'Dansk',
}

const defaultLang = (navLang = navigator.language.replace('-', '_')) => {
	// check if exact or similar languages are available
	for (const [code] of Object.entries(langList)) {
		if (navLang === code || navLang.startsWith(code.substring(0, 2))) {
			return code
		}
	}
	return 'en' // if not, defaults to english
}

function tradThis(str) {
	const lang = document.documentElement.getAttribute('lang')
	return lang === 'en' ? str : dict[str][lang]
}

const syncDefaults = {
	usdate: false,
	showall: false,
	linksrow: 6,
	linkstyle: 'large',
	cssHeight: 80,
	reviewPopup: 0,
	background_blur: 15,
	background_bright: 0.8,
	css: '',
	lang: defaultLang(),
	favicon: '',
	tabtitle: '',
	greeting: '',
	dark: 'system',
	custom_every: 'pause',
	background_type: 'dynamic',
	clock: {
		ampm: false,
		analog: false,
		seconds: false,
		face: 'none',
		timezone: 'auto',
	},
	dynamic: {
		every: 'hour',
		collection: '',
		lastCollec: '',
		time: Date.now(),
	},
	weather: {
		ccode: 'FR',
		city: 'Paris',
		unit: 'metric',
		location: [],
		forecast: 'auto',
		temperature: 'actual',
	},
	searchbar: {
		on: false,
		opacity: 0.1,
		newtab: false,
		engine: 'google',
		request: '',
	},
	quotes: {
		on: false,
		author: false,
		type: 'classic',
		frequency: 'day',
		last: 1650516688,
	},
	font: {
		url: '',
		family: '',
		size: '14',
		availWeights: [],
		weight: testOS.windows ? '400' : '300',
	},
	textShadow: 0.2,
	hide: [[0, 0], [0, 0, 0], [0], [0]],
	about: { browser: detectPlatform(), version: '1.14.2' },
}

const localDefaults = {
	selectedId: '',
	idsList: [],
	quotesCache: [],
	dynamicCache: {
		noon: [],
		day: [],
		evening: [],
		night: [],
		user: [],
	},
}
