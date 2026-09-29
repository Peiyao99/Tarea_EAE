import React, {useEffect, useRef} from 'react';
import {AppProvider, useApp} from '@/store';
import {Home} from '@/screens/Home';
import {Library, TemplateDetail} from '@/screens/Library';
import {Flow} from '@/screens/Flow';
import {KitDetail, KitList} from '@/screens/Kit';
import {Me, Apply} from '@/screens/Me';
import {CreatorPage} from '@/screens/Creator';

// Mounts the real v3 screens at their native 390px width. Each shot owns an AppProvider and
// reaches its demo state through the store's own actions (startFlow, go, setIdentity, setFlow),
// the same calls the prototype's buttons make.
function Setup({run}) {
  const app = useApp(), once = useRef(false);
  useEffect(() => { if (!once.current) { once.current = true; run?.(app); } }, []);
  return null;
}
function Screen() {
  const s = useApp().screen;
  switch (s.name) {
    case 'home': return <Home />;
    case 'library': return <Library />;
    case 'tpl': return <TemplateDetail k={s.tpl} />;
    case 'flow': return <Flow />;
    case 'kit': return <KitList />;
    case 'kitDetail': return <KitDetail id={s.id} />;
    case 'me': return <Me />;
    case 'apply': return <Apply />;
    case 'creator': return <CreatorPage self />;
    case 'profile': return <CreatorPage self={false} />;
    default: return null;
  }
}
/** A real v3 screen. `setup(app)` stages it; `scrollTo` scrolls the screen's own scroller. */
export function LiveApp({setup, height = 844, scrollTo = 0, className = ''}) {
  const ref = useRef(null);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.querySelectorAll('main, main .overflow-y-auto').forEach(e => { e.scrollTop = scrollTo; }), 400);
    return () => clearTimeout(id);
  }, [scrollTo]);
  return <div ref={ref} className={'live-app phone ' + className} style={{width: 390, height}}>
    <AppProvider><Setup run={setup} />
      <main className="live-main"><Screen /></main>
    </AppProvider>
  </div>;
}
