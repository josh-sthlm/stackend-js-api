// @flow
import * as reducer from './referenceReducer';

interface RecieveReferences {
	entries: { [key: number]: any }
}


export function recieveReferences({ entries }: RecieveReferences): reducer.Recieve {
	return {
		type: reducer.RECIEVE_REFERENCES,
		entries
	};
}
