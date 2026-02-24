import Image from 'next/image'

export function Logo({ width = 200, height = 44 }: { width?: number; height?: number }) {
  return (
    <Image
      src="/hotpatch_logo.svg"
      alt="HotPatch Logo"
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}

