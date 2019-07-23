class BracketTree extends Array {
	constructor(strOrBt, open, close) {
		super();
		Object.assign(this, {
			string: false,
			complete: strOrBt.complete || false,
		});

		if (typeof strOrBt == 'string') {
			function stringUsed(str, value) {
				if (!str) throw "'open' is the empty string"
				let matches = []
				let index = 0;
				while (index + str.length <= strOrBt.length) {
					if (strOrBt.slice(index, index + str.length) === str) {
						matches.push({
							start: index,
							get end() {
								return this.start + this.length;
							},
							length: str.length,
							value: value,
							match: str,
						});

						index += str.length;
					} else {
						index++;
					}
				}

				return matches;
			};

			function reUsed(re, value) {
			 	re = RegExp(re, 'g')
				let matches = [];
				let match;
				while (match = re.exec(strOrBt)) {
					let l = match[0].length;
					if (l === 0) throw re.toString() + " has a match of length 0"
					matches.push({
						start: match.index,
						get end() {
							return this.start + this.length;
						},
						length: match[0].length,
						value: value,
						match: match[0],
					});

					//matches.push([match.index, match[0].length]);
				}

				return matches;
			};

			let opens = [];
			if (typeof open == 'string') {
				opens = stringUsed(open, 1);
			} else {
				opens = reUsed(open, 1);
			}

			let closes = [];
			if (typeof close == 'string') {
				closes = stringUsed(close, -1);
			} else {
				closes = reUsed(close, -1);
			}

			if (opens.length === 0 || closes.length === 0) {
				this.string = true;
				this.add(strOrBt);
			} else {
				let combined = [];
				let o = 0;
				let c = 0;
				// start after the first open match
				while (closes[c] && closes[c].start < opens[0].start) {
					c++;
				}

				if (!closes[c]) {
					this.string = true;
					this.add(strOrBt);
				} else {
					let errMsg = `${open} and ${close} have matches that overlap`
					// put the matches in order untill either opens or closes has been used up
					while (opens[o] && closes[c]) {
						if (opens[o].start < closes[c].start) {
							combined.push(opens[o++]);
						} else if (closes[c].start < opens[o].start) {
							combined.push(closes[c++]);
						} else {
							throw errMsg;
						}
					}

					// figure out which one hasn't been used up yet, then concatentate it to the list
					let append;
					if (opens[o]) {
						append = opens.slice(o);
					} else {
						append = closes.slice(c);
					}

					combined = combined.concat(append);
					// make sure there's no overlap
					for (let i = 0; i < combined.length - 1; i++) {
						if (combined[i].end > combined[i + 1].start) {
							throw errMsg;
						}
					}

					let openIndex = 0;
					let closeIndex = 0;
					let count = 0;
					let start = false;
					let pairs = [];
					for (let match of combined) {
						count += match.value;
						if (count < 0) {
							count = 0;
						} else if (count === 0) {
							pairs.push([openIndex, match]);
							start = false;
						} else if (count === 1 && !start) {
							start = true;
							openIndex = match;
						}
					}

					// cover cases like (()
					if (start && closes[closes.length - 1].start > openIndex.start) {
						pairs.push([openIndex, closes[closes.length - 1]]);
					}

					if (pairs[0][0].start === 0 && pairs[0][1].end === strOrBt.length) {
						this.complete = true;
						[
							pairs[0][0].match,
							new this.constructor(strOrBt.slice(pairs[0][0].end, pairs[0][1].start), open, close),
							pairs[0][1].match,
						].forEach(value => this.add(value));
					} else {
						let pairStr = i => strOrBt.slice(pairs[i][0].start, pairs[i][1].end);
						this.add(strOrBt.slice(0, pairs[0][0].start));
						this.add(new this.constructor(pairStr(0), open, close));
						for (let i = 1; i < pairs.length; i++) {
							this.add(strOrBt.slice(pairs[i - 1][1].end, pairs[i][0].start));
							this.add(new this.constructor(pairStr(i), open, close));
						}

						this.add(strOrBt.slice(pairs[pairs.length - 1][1].end));
					}
				}
			}
		} else if (strOrBt instanceof this.constructor) {
			function placeholder() {
				return `${placeholder.outer}${placeholder.current++}${placeholder.outer}`;
			}

			placeholder.map = {};
			placeholder.current = 1;
			placeholder.outer = '@';
			let btCount = 0;
			for (let value of strOrBt) {
				if (value instanceof this.constructor) btCount++
			}

			let btStr = strOrBt.stringsOnly();
			// make sure none of the placeholder strings occur in the string
			while (placeholder.current <= btCount) {
				if (btStr.includes(placeholder())) {
					placeholder.count = 1;
					placeholder.outer += '@';
				}
			}

			placeholder.current = 1;
			let str = ''
			for (let value of strOrBt) {
				if (typeof value == 'string') {
					str += value;
				} else {
					let p = placeholder();
					placeholder.map[p] = value;
					str += p;
				}
			}

			//new this.constructor(str, open, close);
		}
	}

	add(value) {
		if (value.length > 0) {
			if (value.string) {
				this.push(value[0]);
			} else {
				this.push(value);
			}
		}
	}

	stringsOnly() {
		let str = '';
		for (let value of this) {
			if (typeof value == 'string') str += value;
		}

		return str;
	}

	toString() {
		let str = '';
		for (let value of this) {
			if (typeof value == 'string') {
				str += value;
			} else {
				str += value.toString();
			}
		}

		return str;
	}
}

export default BracketTree;
