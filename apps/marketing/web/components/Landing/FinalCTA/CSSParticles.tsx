import classes from './CSSParticles.module.css';

type ParticleProps = {
  id: string;
  color: string;
  opacity: number;
};

const PARTICLE_CONFIGS = [
  { left: 5, top: 10, delay: 0, duration: 20, xDrift: 30, yDrift: 25 },
  { left: 15, top: 60, delay: 2, duration: 25, xDrift: -20, yDrift: 35 },
  { left: 25, top: 30, delay: 4, duration: 22, xDrift: 25, yDrift: -30 },
  { left: 35, top: 80, delay: 1, duration: 28, xDrift: -35, yDrift: 20 },
  { left: 45, top: 20, delay: 3, duration: 24, xDrift: 20, yDrift: 40 },
  { left: 55, top: 70, delay: 5, duration: 26, xDrift: -25, yDrift: -25 },
  { left: 65, top: 40, delay: 2, duration: 21, xDrift: 30, yDrift: 30 },
  { left: 75, top: 85, delay: 4, duration: 27, xDrift: -30, yDrift: 35 },
  { left: 85, top: 15, delay: 1, duration: 23, xDrift: 25, yDrift: -20 },
  { left: 92, top: 55, delay: 3, duration: 29, xDrift: -20, yDrift: 25 },
  { left: 10, top: 45, delay: 6, duration: 30, xDrift: 35, yDrift: -35 },
  { left: 50, top: 5, delay: 5, duration: 19, xDrift: -25, yDrift: 30 },
];

const CSSParticles = ({ id, color, opacity }: ParticleProps) => {
  return (
    <div
      id={id}
      className={classes.container}
      style={
        {
          '--particle-color': color,
          '--particle-opacity': opacity,
        } as React.CSSProperties
      }
    >
      {PARTICLE_CONFIGS.map((config, index) => (
        <div
          key={index}
          className={classes.particle}
          data-index={index}
          style={
            {
              '--left': `${config.left}%`,
              '--top': `${config.top}%`,
              '--delay': `${config.delay}s`,
              '--duration': `${config.duration}s`,
              '--x-drift': `${config.xDrift}px`,
              '--y-drift': `${config.yDrift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default CSSParticles;
