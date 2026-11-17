import { concepts } from './concepts/index';
import { families } from './families';
import { links } from './links';
import { principles } from './principles';
import type { Content } from './schema';
import { sectors } from './sectors/index';

export const content: Content = { concepts, sectors, links, families, principles };
