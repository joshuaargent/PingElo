import { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { siteConfig } from '@/lib/constants';
import { Mail, Youtube, Github, Instagram, Facebook, MapPin, Send } from 'lucide-react';

const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get in touch with me. I'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact"
        description="I'd love to hear from you. Whether it's a question, collaboration idea, or just to say hi."
      />

      <section className="pb-12 md:pb-16">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-text-primary mb-6 text-xl font-semibold">Send a Message</h2>
                {FORMSPREE_FORM_ID ? (
                  <form
                    action={`https://formspree.io/f/${FORMSPREE_FORM_ID}`}
                    method="POST"
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label="Name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        required
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <Input
                      label="Subject"
                      name="subject"
                      type="text"
                      placeholder="What's this about?"
                      required
                    />

                    <Textarea
                      label="Message"
                      name="message"
                      placeholder="Your message..."
                      rows={6}
                      required
                    />

                    <Button type="submit" size="lg" className="w-full" style={{ color: '#ffffff' }}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                    <p className="font-medium">Contact form not configured</p>
                    <p className="mt-1 text-sm">
                      To enable the contact form, add your Formspree form ID to the environment
                      variable{' '}
                      <code className="rounded bg-yellow-100 px-1 py-0.5">
                        NEXT_PUBLIC_FORMSPREE_FORM_ID
                      </code>
                      .<br />
                      Create a form at{' '}
                      <a
                        href="https://formspree.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        formspree.io
                      </a>
                    </p>
                    <div className="mt-4">
                      <a
                        href={siteConfig.links.email}
                        className="text-accent hover:text-accent-hover inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {siteConfig.links.email.replace('mailto:', '')}
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="text-text-primary mb-4 font-semibold">Email</h3>
                <a
                  href={siteConfig.links.email}
                  className="text-text-secondary hover:text-accent flex items-center gap-3 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  {siteConfig.links.email.replace('mailto:', '')}
                </a>
              </Card>

              <Card>
                <h3 className="text-text-primary mb-4 font-semibold">Location</h3>
                <div className="text-text-secondary flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  {siteConfig.location}
                </div>
              </Card>

              <Card>
                <h3 className="text-text-primary mb-4 font-semibold">Connect</h3>
                <div className="space-y-3">
                  {siteConfig.links.youtube && (
                    <a
                      href={siteConfig.links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-bg-secondary flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Youtube className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-text-primary text-sm font-medium">YouTube</p>
                        <p className="text-text-muted text-xs">@joshua_argent</p>
                      </div>
                    </a>
                  )}

                  {siteConfig.links.github && (
                    <a
                      href={siteConfig.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-bg-secondary flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Github className="text-text-primary h-5 w-5" />
                      <div>
                        <p className="text-text-primary text-sm font-medium">GitHub</p>
                        <p className="text-text-muted text-xs">@joshuaargent</p>
                      </div>
                    </a>
                  )}

                  {siteConfig.links.instagram && (
                    <a
                      href={siteConfig.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-bg-secondary flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <div>
                        <p className="text-text-primary text-sm font-medium">Instagram</p>
                        <p className="text-text-muted text-xs">@joshua_argent</p>
                      </div>
                    </a>
                  )}

                  {siteConfig.links.facebook && (
                    <a
                      href={siteConfig.links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-bg-secondary flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-text-primary text-sm font-medium">Facebook</p>
                        <p className="text-text-muted text-xs">@joshua_argent</p>
                      </div>
                    </a>
                  )}

                  {siteConfig.links.strava && (
                    <a
                      href={siteConfig.links.strava}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-bg-secondary flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <svg className="h-5 w-5 text-orange-500" viewBox="0 0 16 16">
                        <path
                          fill="currentColor"
                          d="M6.731 0 2 9.125h2.788L6.73 5.497l1.93 3.628h2.766zm4.694 9.125-1.372 2.756L8.66 9.125H6.547L10.053 16l3.484-6.875z"
                        />
                      </svg>
                      <div>
                        <p className="text-text-primary text-sm font-medium">Strava</p>
                        <p className="text-text-muted text-xs">@500534339</p>
                      </div>
                    </a>
                  )}
                </div>
              </Card>

              <Card className="bg-accent-light">
                <h3 className="text-text-primary mb-2 font-semibold">Response Time</h3>
                <p className="text-text-secondary text-sm">
                  I typically respond within 24-48 hours. For urgent matters, reach out via
                  Instagram DM.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
