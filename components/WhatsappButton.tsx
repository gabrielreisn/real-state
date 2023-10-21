export const WhatsappButton = () => {
  //@TODO: track analytics
  //@TODO: add animate-ping

  const WHATSAPP_NUMBER = '+5527999696096'

  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`

  return (
    <div className="fixed right-10 bottom-10">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-60" />
      <a
        className="rounded-full bg-green-600 w-16 h-16  flex justify-center items-center"
        target="_blank"
        href={WHATSAPP_LINK}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          stroke="#fff"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>
        </svg>
      </a>
    </div>
  )
}
