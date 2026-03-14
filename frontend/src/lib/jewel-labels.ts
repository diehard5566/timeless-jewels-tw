/**
 * 永恆珠寶 / 征服者 繁中名稱 fallback（WASM 未提供 TimelessJewelsTW / ConquerorNameTW 時使用）
 * 與 data/jewels.go 對應，參考 https://poedb.tw/tw/Timeless_Jewel#AlternatePassive
 */
export const JEWEL_NAME_TW: Record<number, string> = {
	1: '輝煌的虛榮',
	2: '致命的驕傲',
	3: '殘酷的紀律',
	4: '激進的信仰',
	5: '優雅的高傲',
};

export const CONQUEROR_NAME_TW: Record<string, string> = {
	Xibaqua: '賽巴昆',
	Ahuana: '阿呼阿娜',
	Doryani: '多里亞尼',
	Kaom: '岡姆',
	Rakiata: '拉其塔',
	Akoya: '阿冦亞',
	Balbala: '貝爾巴拉',
	Asenath: '安賽娜絲',
	Nasima: '納西瑪',
	Maxarius: '瑪薩里歐斯',
	Dominus: '神主',
	Avarius: '伊爾莉斯',
	Cadiro: '卡迪羅',
	Victario: '維多里奧',
	Caspiro: '卡斯皮羅',
};

export function getJewelLabel(twFromWasm: Record<number, string> | undefined, enFromWasm: Record<number, string> | undefined, key: string): string {
	const k = Number(key);
	return twFromWasm?.[k] ?? JEWEL_NAME_TW[k] ?? enFromWasm?.[k] ?? key;
}

export function getConquerorLabel(twFromWasm: Record<string, string> | undefined, key: string): string {
	return twFromWasm?.[key] ?? CONQUEROR_NAME_TW[key] ?? key;
}
