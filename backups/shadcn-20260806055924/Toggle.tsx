import { InputHTMLAttributes, forwardRef } from 'react'

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = '', label, checked, onChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className={`relative w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)] ${className}`} />
        {label && <span className="mr-3 text-sm font-medium text-[var(--color-text)]">{label}</span>}
      </label>
    )
  }
)

Toggle.displayName = 'Toggle'

export default Toggle
