import './MarqueeStrip.css';

const TEXT = '/ ЗВУК / СТИЛЬ / ЖИЗНЬ ';
const REPEAT = 15;

function MarqueeStrip() {
  const content = TEXT.repeat(REPEAT);

  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-strip-inner">
        <span className="marquee-strip-text">{content}</span>
        <span className="marquee-strip-text" aria-hidden="true">{content}</span>
      </div>
    </div>
  );
}

export default MarqueeStrip;
