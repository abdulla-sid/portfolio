<script lang="ts">
  import { contactFormModule } from "../contact/lazyForm";

  let formModule = $state(contactFormModule());
</script>

<div class="contact">
  <p class="lede">
    Got a project, a job, or a playlist suggestion? Drop me a line.
  </p>
  <div class="form-slot">
    {#await formModule then { default: ContactForm }}
      <ContactForm />
    {:catch}
      <p class="form-failed" role="alert">
        THE FORM DID NOT LOAD.
        <button
          type="button"
          onclick={() => (formModule = contactFormModule())}
        >
          RETRY
        </button>
      </p>
    {/await}
  </div>
</div>

<style>
  .contact {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .lede {
    margin-bottom: 30px;
  }

  .form-failed {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--text-muted);
  }

  .form-failed button {
    border: 2px solid var(--ui-accent);
    background: none;
    padding: 8px 14px;
    color: var(--ui-accent);
    font: inherit;
    font-size: 8px;
    letter-spacing: 1px;
    cursor: pointer;
  }

  .form-slot {
    container: contact-form / inline-size;
    display: grid;
    flex: 1;
    min-height: 0;
  }

  @media (max-width: 900px) {
    .lede {
      margin-bottom: 32px;
      padding-bottom: 6px;
      border-bottom: 2px dashed var(--ui-accent-deep);
    }

    /*
     * Filling the panel only works while the form fits it. On a short phone
     * the fields need more room than is left, and a stretched slot cannot
     * give it to them — the message box grew past its row and sat on top of
     * the send button. Let the form take the height it needs and scroll.
     */
    .contact {
      height: auto;
    }

    .form-slot {
      flex: none;
      min-height: auto;
    }
  }
</style>
