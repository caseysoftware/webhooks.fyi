import HookdeckLogo from '../../public/img/hookdeck.svg'

export function LogoSponsor() {
  return (
    <img
      src={HookdeckLogo.src}
      alt="Hookdeck"
      width={178}
      height={29}
      className="min-h-[29px] min-w-[178px] invert dark:invert-0"
    />
  )
}
