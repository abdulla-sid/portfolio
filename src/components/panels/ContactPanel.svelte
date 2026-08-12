<script lang="ts">
  const formModule = import("../contact/ContactForm.svelte");
</script>

<div class="contact">
  <p class="lede">
    Got a project, a job, or a playlist suggestion? Drop me a line.
  </p>
  <div class="form-slot">
    {#await formModule then { default: ContactForm }}
      <ContactForm />
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
  }
</style>
