import { work } from '../../content/work';
import { createStore } from '../store';

/** Which work entry is shown. The tabs and the map pins both write it; both follow it. */
export const selection = createStore({ id: work[0]?.id ?? '' });
