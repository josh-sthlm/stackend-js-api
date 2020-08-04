// @flow
import * as reducer from './referenceReducer.js';

type RecieveReferences = {
	entries: { [key: number]: any }
};
//test
export function recieveReferences({ entries }: RecieveReferences): reducer.Recieve {
	return {
		type: reducer.RECIEVE_REFERENCES,
		entries
	};
}
