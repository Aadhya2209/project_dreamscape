type Star = { x: number; y: number; size: number; delay: number; duration: number; tone: number };

// Fixed positions keep the night sky from jumping when tabs or pages change.
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const stars: Star[] = Array.from({ length: 150 }, (_, i) => ({
  x: random(i + 1) * 100,
  y: random(i + 401) * 100,
  size: i % 13 === 0 ? 3 : i % 4 === 0 ? 2 : 1,
  delay: -random(i + 801) * 9,
  duration: 3 + random(i + 1201) * 6,
  tone: i % 7,
}));

const galaxyStars: Star[] = Array.from({ length: 95 }, (_, i) => {
  const angle = random(i + 1601) * Math.PI * 2;
  const radius = Math.sqrt(random(i + 2001));
  return {
    x: 50 + Math.cos(angle) * radius * 47,
    y: 50 + Math.sin(angle) * radius * 22,
    size: i % 11 === 0 ? 2.5 : 1,
    delay: -random(i + 2401) * 9,
    duration: 3 + random(i + 2801) * 6,
    tone: i % 7,
  };
});

const StarDot = ({ star }: { star: Star }) => (
  <span
    className={`cosmic-star ${star.tone === 0 ? 'cosmic-star-warm' : star.tone === 1 ? 'cosmic-star-cool' : ''}`}
    style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }}
  />
);

const FloatingStars = () => (
  <div className="cosmic-sky" aria-hidden="true">
    <div className="cosmic-galaxy">
      <div className="cosmic-galaxy-haze" />
      {galaxyStars.map((star, i) => <StarDot key={`galaxy-${i}`} star={star} />)}
    </div>
    {stars.map((star, i) => <StarDot key={i} star={star} />)}
    <span className="cosmic-meteor cosmic-meteor-one" />
    <span className="cosmic-meteor cosmic-meteor-two" />
    <span className="cosmic-meteor cosmic-meteor-three" />
  </div>
);

export default FloatingStars;